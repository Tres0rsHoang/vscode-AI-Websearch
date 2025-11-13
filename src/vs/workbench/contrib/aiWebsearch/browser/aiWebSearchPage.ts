/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { $, addDisposableListener, Dimension, EventType } from '../../../../base/browser/dom.js';
import { StandardKeyboardEvent } from '../../../../base/browser/keyboardEvent.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { KeyCode } from '../../../../base/common/keyCodes.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { ProxyChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { localize } from '../../../../nls.js';
import { IBrowserViewService } from '../../../../platform/browserView/common/browserViewService.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IEditorOptions } from '../../../../platform/editor/common/editor.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IMainProcessService } from '../../../../platform/ipc/common/mainProcessService.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import {
	IEditorOpenContext,
	IEditorSerializer,
} from '../../../common/editor.js';
import { IEditorGroup } from '../../../services/editor/common/editorGroupsService.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { IWorkbenchThemeService } from '../../../services/themes/common/workbenchThemeService.js';
import { AIWebSearchEditorInput, MessageData } from './aiWebSearchInput.js';
import './media/chatbox.css';



export class AIWebSearchPage extends EditorPane {
	public static readonly ID = 'workbench.editor.aiWebSearchPage';
	private readonly disposables = new DisposableStore();

	private mainContainer: HTMLElement;
	private sendButton!: HTMLButtonElement;
	private inputField!: HTMLTextAreaElement;

	private inputUrlField: HTMLInputElement;

	private chatContainerElement!: HTMLElement;
	private messageElements: HTMLElement[] = [];

	private browserViewMainService: IBrowserViewService;
	private browserViewBounds: { x: number; y: number; height: number; width: number };
	private url: string = '';

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IWorkbenchThemeService
		protected override readonly themeService: IWorkbenchThemeService,
		@IStorageService protected readonly storageService: IStorageService,
		@IMainProcessService mainProcessService: IMainProcessService,
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IEditorService private readonly editorService: IEditorService
	) {
		super(
			AIWebSearchPage.ID,
			group,
			telemetryService,
			themeService,
			storageService
		);

		this.mainContainer = $('.aiWebSearchContainer', {
			role: 'document',
			tabindex: 0,
		});
		this.mainContainer = document.createElement('div');
		this.mainContainer.className = 'main-container';

		const browserView = $('p.browser-view');
		this.inputUrlField = $('input#url-input', {
			type: 'text',
			placeholer: 'Enter URL...',
		});
		browserView.append(this.inputUrlField, $('p#loading-text', {}, 'AI Web Browser - Loading...'));

		const chatBoxContainer = $('div.chatbox-container');
		this.getChatboxViewContent(chatBoxContainer);

		this.mainContainer.appendChild(browserView);
		this.mainContainer.appendChild(chatBoxContainer);
		this.browserViewMainService = ProxyChannel.toService<IBrowserViewService>(mainProcessService.getChannel('browserView'));

		this.disposables.add(
			this.browserViewMainService.onDidNavigate(({ url }) => {
				this.url = url;
				this.inputUrlField.value = url;
			})
		);
		this.disposables.add(addDisposableListener(this.inputUrlField, EventType.KEY_DOWN, (e: KeyboardEvent) => {
			const event = new StandardKeyboardEvent(e);
			if (event.keyCode === KeyCode.Enter) {
				event.preventDefault();
				this.browserViewMainService.openWebContentsView(this.inputUrlField.value, this.browserViewBounds);
			}
		}));
		this.browserViewBounds = { x: 0, y: 0, height: 0, width: 0 };
	}

	protected override createEditor(parent: HTMLElement): void {
		parent.append(this.mainContainer);
	}

	override layout(dimension: Dimension): void {
		const rect = this.mainContainer.getBoundingClientRect();
		this.browserViewBounds = {
			x: rect.x,
			y: rect.y + 50,
			height: dimension.height - 50,
			width: dimension.width * 0.7
		};
		this.browserViewMainService.resizeWebContentsView(this.browserViewBounds);
	}

	override async setInput(
		newInput: AIWebSearchEditorInput,
		options: IEditorOptions | undefined,
		context: IEditorOpenContext,
		token: CancellationToken
	) {
		await super.setInput(newInput, options, context, token);
		this.inputUrlField.value = newInput.url;
		if (newInput.url !== this.url) {
			this.url = newInput.url;
			this.browserViewMainService.openWebContentsView(newInput.url, this.browserViewBounds);
		}

		this.browserViewMainService.resizeWebContentsView(this.browserViewBounds);
		this.loadMessagesFromData(newInput.messages);
	}

	override clearInput() {
		this.browserViewMainService.hideWebContentsView();
		super.clearInput();
	}

	override dispose() {
		this.browserViewMainService.dispose();
		super.dispose();
	}

	getChatboxViewContent(chatBoxContainer: HTMLElement): void {
		this.chatContainerElement = $('div#chat-container');
		const inputArea = $('div#input-area');
		this.sendButton = $('button#send-button', { onclick: () => this.sendPromt() }, $('span.button-text', {}, 'Send'), $('span.spinner'));

		this.inputField = $('textarea#prompt-input', {
			placeholder: localize('inputMessage', 'Input your prompt (Shift+Enter to get new line, Enter to send)...'),
			rows: '2',
		});
		this.disposables.add(addDisposableListener(this.inputField, EventType.KEY_DOWN, (e: KeyboardEvent) => {
			const event = new StandardKeyboardEvent(e);
			if (event.keyCode === KeyCode.Enter && !event.shiftKey) {
				event.preventDefault();
				this.sendPromt();
			}
		}));

		inputArea.append(this.inputField, this.sendButton);
		chatBoxContainer.append(this.chatContainerElement, inputArea);
	}

	addNewMessage(content: string, isAI: boolean = false) {
		const newMessage = $(`div${isAI ? '.ai-message' : '.user-message'}.message`, {}, content);
		this.messageElements.push(newMessage);
		this.chatContainerElement.prepend(newMessage);

		const activeEditorPane = this.editorService.activeEditorPane;
		if (activeEditorPane) {
			const editorInput = activeEditorPane.input as AIWebSearchEditorInput;
			if (editorInput instanceof AIWebSearchEditorInput) {
				editorInput.messages = this.getMessagesData();
			}
		}
	}

	async sendPromt() {
		if (this.inputField.value === '' || this.sendButton.disabled) { return; }

		const api_key = this.configurationService.getValue('aiBrowser.API_KEY');
		const model = this.configurationService.getValue('aiBrowser.MODEL');
		const newMessageContent = this.inputField.value;
		this.inputField.value = '';
		this.addNewMessage(newMessageContent);
		this.sendButton.className += 'is-loading';
		this.sendButton.disabled = true;

		try {
			const webContent = await this.browserViewMainService.getWebContent();
			const messagesData = this.getMessagesData();
			messagesData.push({
				role: 'user',
				content: webContent,
			});

			const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${api_key}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: model,
					messages: messagesData
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error.message);
			}
			const data = await response.json();
			for (let index = 0; index < data.choices.length; index++) {
				const message = data.choices[index].message.content;
				this.addNewMessage(message, true);
			}
		}
		catch (error) {
			console.error(error);
			throw new Error('Got error on call OpenRouter API');
		}

		this.sendButton.className = '';
		this.sendButton.disabled = false;

	}

	private getMessagesData(): MessageData[] {
		return this.messageElements.map(el => {
			const role = el.className.includes('ai-message') ? 'assistant' : 'user';
			return {
				role,
				content: el.textContent || '',
			};
		});
	}

	private loadMessagesFromData(messagesData: MessageData[]) {
		while (this.chatContainerElement.firstChild) {
			this.chatContainerElement.firstChild.remove();
		}
		this.messageElements = [];

		messagesData.forEach(msg => {
			const el = $(`div${msg.role === 'assistant' ? '.ai-message' : '.user-message'}.message`, {}, msg.content);
			this.messageElements.push(el);
			this.chatContainerElement.prepend(el);
		});
	}

}

export class AIWebSearchEditorInputSerializer implements IEditorSerializer {
	canSerialize(editorInput: AIWebSearchEditorInput): boolean {
		void editorInput;
		return true;
	}

	serialize(editorInput: AIWebSearchEditorInput): string {
		return JSON.stringify({ url: editorInput.url, messages: editorInput.messages });
	}

	deserialize(
		instantiationService: IInstantiationService,
		serializedEditorInput: string
	): AIWebSearchEditorInput {
		void serializedEditorInput;
		return instantiationService.invokeFunction((accessor) => {
			void accessor;
			try {
				const { url, messages } = JSON.parse(serializedEditorInput);
				return new AIWebSearchEditorInput(url, messages);
			} catch { }
			return new AIWebSearchEditorInput('');
		});
	}
}
