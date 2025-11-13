/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BrowserWindow, Rectangle, WebContentsView } from 'electron';
import { Emitter, Event } from '../../../base/common/event.js';
import { IBrowserViewService } from '../common/browserViewService.js';

export class BrowserViewMainService implements IBrowserViewService {
	_serviceBrand: undefined;

	private readonly _onDidNavigate = new Emitter<{ url: string }>();
	readonly onDidNavigate: Event<{ url: string }> = this._onDidNavigate.event;

	private views = new Map<number, WebContentsView>();

	async openWebContentsView(url: string, bounds: Rectangle, windowId?: number): Promise<void> {
		const win = windowId
			? BrowserWindow.fromId(windowId)
			: BrowserWindow.getFocusedWindow();
		if (!win) {
			throw new Error('No suitable BrowserWindow found for WebContentsView');
		}
		let view = this.views.get(win.id);
		if (view) {
			win.contentView.removeChildView(view);
			view.webContents.close();
			this.views.delete(win.id);
		}
		view = new WebContentsView({
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
			}
		});
		await view.webContents.loadURL(url);
		view.webContents.setWindowOpenHandler(({ url }) => {
			view.webContents.loadURL(url);
			this._onDidNavigate.fire({ url: url });
			return { action: 'deny' };
		});

		view.webContents.on('will-navigate', (event, url) => {
			event.preventDefault();
			view.webContents.loadURL(url);
			this._onDidNavigate.fire({ url: url });
		});

		win.contentView.addChildView(view);
		view.setBounds(bounds);
		this.views.set(win.id, view);
	}

	hideWebContentsView(windowId?: number): void {
		const win = windowId
			? BrowserWindow.fromId(windowId)
			: BrowserWindow.getFocusedWindow();
		if (!win) { return; }
		const view = this.views.get(win.id);
		if (view) {
			view.setVisible(false);
		}
	}

	resizeWebContentsView(bounds: Electron.Rectangle, windowId?: number): void {
		const win = windowId
			? BrowserWindow.fromId(windowId)
			: BrowserWindow.getFocusedWindow();
		if (!win) { return; }
		const view = this.views.get(win.id);
		if (!view) {
			return;
		}
		view.setVisible(true);
		view.setBounds(bounds);
	}

	dispose() {
		for (const [winId, view] of this.views) {
			try {
				view.webContents.close();
			} catch { }
			this.views.delete(winId);
		}
	}

	async getWebContent(windowId?: number): Promise<string> {
		const win = windowId
			? BrowserWindow.fromId(windowId)
			: BrowserWindow.getFocusedWindow();
		if (!win) { return ''; }
		const view = this.views.get(win.id);
		if (!view) {
			return '';
		}
		const html = await view.webContents.executeJavaScript('document.body.innerText');
		return html;
	}
}
