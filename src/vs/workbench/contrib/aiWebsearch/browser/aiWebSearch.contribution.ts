/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ServicesAccessor } from '../../../../editor/browser/editorExtensions.js';
import { localize, localize2 } from '../../../../nls.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { Action2, MenuId, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { EditorExtensions, IEditorFactoryRegistry } from '../../../common/editor.js';
import { ACTIVE_GROUP, IEditorService } from '../../../services/editor/common/editorService.js';
import { AIWebSearchEditorInputSerializer, AIWebSearchPage } from './aiWebSearch.js';
import { AIWebsearchEditorInput } from './aiWebSearchEditor.js';

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
					description: localize2('aiWebSearchDescription', 'Open AI Web Search Tab'),
				},
			});
		}

		public run(accessor: ServicesAccessor) {
			const editorService = accessor.get(IEditorService);
			const input = accessor.get(IInstantiationService).createInstance(AIWebsearchEditorInput);
			editorService.openEditor(input, ACTIVE_GROUP);
		}
	}
);

Registry.as<IEditorFactoryRegistry>(EditorExtensions.EditorFactory).registerEditorSerializer(AIWebsearchEditorInput.ID, AIWebSearchEditorInputSerializer);
Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(EditorPaneDescriptor.create(AIWebSearchPage, AIWebSearchPage.ID, localize('aiBrowser', 'AI Web Browser')), [new SyncDescriptor(AIWebsearchEditorInput)]);
