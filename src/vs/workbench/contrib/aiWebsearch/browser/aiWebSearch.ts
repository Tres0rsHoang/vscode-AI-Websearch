/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { $, Dimension } from '../../../../base/browser/dom.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { IEditorOpenContext, IEditorSerializer } from '../../../common/editor.js';
import { IEditorGroup } from '../../../services/editor/common/editorGroupsService.js';
import { IWorkbenchThemeService } from '../../../services/themes/common/workbenchThemeService.js';
import { AIWebsearchEditorInput, AIWebsearchEditorOptions } from './aiWebSearchEditor.js';

export class AIWebSearchPage extends EditorPane {
	public static readonly ID = 'aiWebSearchPage';
	private container: HTMLElement;

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IWorkbenchThemeService
		protected override readonly themeService: IWorkbenchThemeService,
		@IStorageService protected readonly storageService: IStorageService
	) {
		super(AIWebSearchPage.ID, group, telemetryService, themeService, storageService);
		this.container = $('.aiWebSearchContainer', {
			role: 'document',
			tabindex: 0,
		});
	}

	protected override createEditor(parent: HTMLElement): void {
		this.container = document.createElement('div');
		this.container.style.display = 'flex';
		this.container.style.alignItems = 'center';
		this.container.style.justifyContent = 'center';
		this.container.style.height = '100%';
		this.container.style.fontSize = '18px';
		this.container.textContent = 'AI WebSearch - Coming soon!';
		parent.append(this.container);
	}

	override layout(dimension: Dimension): void {
		void dimension;
	}

	override async setInput(newInput: AIWebsearchEditorInput, options: AIWebsearchEditorOptions | undefined, context: IEditorOpenContext, token: CancellationToken) {
		await super.setInput(newInput, options, context, token);
	}
}

export class AIWebSearchEditorInputSerializer implements IEditorSerializer {
	canSerialize(editorInput: AIWebsearchEditorInput): boolean {
		void editorInput;
		return true;
	}

	serialize(editorInput: AIWebsearchEditorInput): string {
		void editorInput;
		return '';
	}

	deserialize(instantiationService: IInstantiationService, serializedEditorInput: string): AIWebsearchEditorInput {
		void serializedEditorInput;
		return instantiationService.invokeFunction((accessor) => {
			void accessor;
			try {
				return new AIWebsearchEditorInput();
			} catch { }
			return new AIWebsearchEditorInput();
		});
	}
}

