/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ServicesAccessor } from '../../../../editor/browser/editorExtensions.js';
import { localize, localize2 } from '../../../../nls.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import {
	Action2,
	MenuId,
	registerAction2,
} from '../../../../platform/actions/common/actions.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { IQuickInputService } from '../../../../platform/quickinput/common/quickInput.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import {
	EditorPaneDescriptor,
	IEditorPaneRegistry,
} from '../../../browser/editor.js';
import {
	EditorExtensions,
	IEditorFactoryRegistry,
} from '../../../common/editor.js';
import { IEditorGroupsService } from '../../../services/editor/common/editorGroupsService.js';
import { AIWebSearchEditorInput } from './aiWebSearchInput.js';
import {
	AIWebSearchEditorInputSerializer,
	AIWebSearchPage,
} from './aiWebSearchPage.js';

registerAction2(
	class extends Action2 {
		constructor() {
			super({
				id: 'workbench.action.openAIWebSearch',
				title: localize2('openAiWebSearch', 'Open AI Web Search'),
				category: Categories.View,
				f1: true,
				menu: {
					id: MenuId.AIWebSearch,
					group: '1_aiwebsearch',
					order: 1,
				},
				metadata: {
					description: localize2(
						'aiWebSearchDescription',
						'Open AI Web Search Tab'
					),
				},
			});
		}

		public async run(accessor: ServicesAccessor): Promise<void> {
			const quickPickService = accessor.get(IQuickInputService);
			const editorGroupsService = accessor.get(IEditorGroupsService);

			const url = await quickPickService.input({
				placeHolder: 'https://example.com',
				prompt: localize(
					'aiWebSearchPrompt',
					'Enter URL to open in AI Web Search'
				),
			});
			if (!url) {
				return;
			}
			const input = new AIWebSearchEditorInput(url);
			editorGroupsService.activeGroup.openEditor(input, { pinned: true });
		}
	}
);

Registry.as<IEditorFactoryRegistry>(
	EditorExtensions.EditorFactory
).registerEditorSerializer(
	AIWebSearchEditorInput.ID,
	AIWebSearchEditorInputSerializer
);

Registry.as<IEditorPaneRegistry>(
	EditorExtensions.EditorPane
).registerEditorPane(
	EditorPaneDescriptor.create(
		AIWebSearchPage,
		AIWebSearchPage.ID,
		localize('aiWebBrowser', 'AI Web Browser')
	),
	[new SyncDescriptor(AIWebSearchEditorInput)]
);
