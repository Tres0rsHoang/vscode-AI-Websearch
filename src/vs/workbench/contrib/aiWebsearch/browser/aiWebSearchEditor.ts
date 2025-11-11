/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from '../../../../base/common/codicons.js';
import { Schemas } from '../../../../base/common/network.js';
import { URI } from '../../../../base/common/uri.js';
import { localize } from '../../../../nls.js';
import { IEditorOptions } from '../../../../platform/editor/common/editor.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { IUntypedEditorInput } from '../../../common/editor.js';
import { EditorInput } from '../../../common/editor/editorInput.js';

export const aiWebsearchIcon = registerIcon(
	'ai-websearch-icon',
	Codicon.sparkle,
	localize('aiWebsearchIcon', 'AI WebSearch icon'),
);

export type Message = {
	content: string;
	time: Date;
	isAi: boolean;
};

export interface AIWebsearchEditorOptions extends IEditorOptions {
	currentURL?: string;
	messages: Message[];
}

export class AIWebsearchEditorInput extends EditorInput {
	static readonly ID = 'workbench.editorinputs.aiWebsearchInput';
	static readonly RESOURCE = URI.from({ scheme: Schemas.aiBr, authority: 'web-search' });

	override get typeId(): string {
		return AIWebsearchEditorInput.ID;
	}

	override get editorId(): string | undefined {
		return this.typeId;
	}

	override toUntyped(): IUntypedEditorInput {
		return {
			resource: AIWebsearchEditorInput.RESOURCE,
			options: {
				override: AIWebsearchEditorInput.ID,
				pinned: false,
			},
		};
	}

	get resource(): URI | undefined {
		return AIWebsearchEditorInput.RESOURCE;
	}

	override matches(other: EditorInput | IUntypedEditorInput): boolean {
		if (super.matches(other)) {
			return true;
		}

		return other instanceof AIWebsearchEditorInput;
	}

	override getName() {
		return localize('aiBrowser', 'AI Web Browser');
	}
}
