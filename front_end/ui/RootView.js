// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @extends {WebInspector.VBox}
 * @suppressGlobalPropertiesCheck
 */
WebInspector.RootView = function()
{
    WebInspector.VBox.call(this);
    this.markAsRoot();
    this.element.classList.add("root-view");
    this.element.setAttribute("spellcheck", false);
    // This view is not designed to change owner document.
    window.addEventListener("resize", this.doResize.bind(this), false);
}

WebInspector.RootView.prototype = {
    /**
     * @public // FIXME: this is a workaround for validator bug (http://crbug.com/425506).
     * @suppressGlobalPropertiesCheck
     */
    attachToBody: function()
    {
        this.doResize();
        this.show(document.body);
    },

    doResize: function()
    {
        var size = this.constraints().minimum;
        var zoom = WebInspector.zoomManager.zoomFactor();
        var right = Math.min(0, window.innerWidth - size.width / zoom);
        this.element.style.marginRight = right + "px";
        var bottom = Math.min(0, window.innerHeight - size.height / zoom);
        this.element.style.marginBottom = bottom + "px";
        WebInspector.VBox.prototype.doResize.call(this);
    },

    __proto__: WebInspector.VBox.prototype
}
