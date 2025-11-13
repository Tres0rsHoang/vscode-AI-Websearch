/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Event } from '../../../base/common/event.js';
import { createDecorator } from '../../instantiation/common/instantiation.js';
export interface IBrowserViewService {
	readonly _serviceBrand: undefined;

	openWebContentsView(url: string, bounds: Electron.Rectangle, windowId?: number): Promise<void>;

	hideWebContentsView(windowId?: number): void;

	resizeWebContentsView(bounds: Electron.Rectangle, windowId?: number): void;

	dispose(): void;

	onDidNavigate: Event<{ url: string }>;

	getWebContent(windowId?: number): Promise<string>;
}

export const IBrowserViewService = createDecorator<IBrowserViewService>('browserViewService');
