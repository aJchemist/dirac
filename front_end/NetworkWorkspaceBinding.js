/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @constructor
 * @extends {WebInspector.ContentProviderBasedProjectDelegate}
 * @param {!WebInspector.Workspace} workspace
 * @param {string} projectId
 * @param {string} projectName
 * @param {!WebInspector.projectTypes} projectType
 */
WebInspector.NetworkProjectDelegate = function(workspace, projectId, projectName, projectType)
{
    this._name = projectName;
    this._id = projectId;
    WebInspector.ContentProviderBasedProjectDelegate.call(this, workspace, projectId, projectType);
    this._lastUniqueSuffix = 0;
}

WebInspector.NetworkProjectDelegate.prototype = {
    /**
     * @return {string}
     */
    id: function()
    {
        return this._id;
    },

    /**
     * @return {string}
     */
    displayName: function()
    {
        if (typeof this._displayName !== "undefined")
            return this._displayName;
        if (!this._name) {
            this._displayName = WebInspector.UIString("(no domain)");
            return this._displayName;
        }
        var parsedURL = new WebInspector.ParsedURL(this._name);
        if (parsedURL.isValid) {
            this._displayName = parsedURL.host + (parsedURL.port ? (":" + parsedURL.port) : "");
            if (!this._displayName)
                this._displayName = this._name;
        }
        else
            this._displayName = this._name;
        return this._displayName;
    },

    /**
     * @param {string} parentPath
     * @param {string} name
     * @param {string} url
     * @param {!WebInspector.ContentProvider} contentProvider
     * @param {boolean} isEditable
     * @return {string}
     */
    addFile: function(parentPath, name, forceUniquePath, url, contentProvider, isEditable)
    {
        if (forceUniquePath)
            name = this._ensureUniqueName(parentPath, name);
        return this.addContentProvider(parentPath, name, url, contentProvider, isEditable);
    },

    /**
     * @param {string} parentPath
     * @param {string} name
     * @return {string}
     */
    _ensureUniqueName: function(parentPath, name)
     {
        var path = parentPath ? parentPath + "/" + name : name;
        var uniquePath = path;
        var suffix = "";
        var contentProviders = this.contentProviders();
        while (contentProviders[uniquePath]) {
            suffix = " (" + (++this._lastUniqueSuffix) + ")";
            uniquePath = path + suffix;
        }
        return name + suffix;
    },

    __proto__: WebInspector.ContentProviderBasedProjectDelegate.prototype
}

/**
 * @constructor
 * @extends {WebInspector.Object}
 * @param {!WebInspector.Workspace} workspace
 */
WebInspector.NetworkWorkspaceBinding = function(workspace)
{
    this._workspace = workspace;
    this._projectDelegates = {};
}

WebInspector.NetworkWorkspaceBinding.prototype = {
    /**
     * @param {string} projectName
     * @param {boolean} isContentScripts
     * @return {!WebInspector.NetworkProjectDelegate}
     */
    _projectDelegate: function(projectName, isContentScripts)
    {
        var projectId = (isContentScripts ? "contentscripts:" : "") + projectName;
        var projectType = isContentScripts ? WebInspector.projectTypes.ContentScripts : WebInspector.projectTypes.Network;

        if (this._projectDelegates[projectId])
            return this._projectDelegates[projectId];
        var projectDelegate = new WebInspector.NetworkProjectDelegate(this._workspace, projectId, projectName, projectType);
        this._projectDelegates[projectId] = projectDelegate;
        return projectDelegate;
    },

    /**
     * @param {string} url
     * @param {!WebInspector.ContentProvider} contentProvider
     * @param {boolean} isEditable
     * @param {boolean=} isContentScript
     * @return {!WebInspector.UISourceCode}
     */
    addFileForURL: function(url, contentProvider, isEditable, isContentScript)
    {
        return this._innerAddFileForURL(url, contentProvider, isEditable, false, isContentScript);
    },

    /**
     * @param {string} url
     * @param {!WebInspector.ContentProvider} contentProvider
     * @param {boolean} isEditable
     * @param {boolean=} isContentScript
     * @return {!WebInspector.UISourceCode}
     */
    addUniqueFileForURL: function(url, contentProvider, isEditable, isContentScript)
    {
        return this._innerAddFileForURL(url, contentProvider, isEditable, true, isContentScript);
    },

    /**
     * @param {string} url
     * @param {!WebInspector.ContentProvider} contentProvider
     * @param {boolean} isEditable
     * @param {boolean} forceUnique
     * @param {boolean=} isContentScript
     * @return {!WebInspector.UISourceCode}
     */
    _innerAddFileForURL: function(url, contentProvider, isEditable, forceUnique, isContentScript)
    {
        var splitURL = WebInspector.ParsedURL.splitURL(url);
        var projectName = splitURL[0];
        var parentPath = splitURL.slice(1, splitURL.length - 1).join("/");
        var name = splitURL[splitURL.length - 1];
        var projectDelegate = this._projectDelegate(projectName, isContentScript || false);
        var path = projectDelegate.addFile(parentPath, name, forceUnique, url, contentProvider, isEditable);
        var uiSourceCode = /** @type {!WebInspector.UISourceCode} */ (this._workspace.uiSourceCode(projectDelegate.id(), path));
        console.assert(uiSourceCode);
        return uiSourceCode;
    },

    reset: function()
    {
        for (var projectId in this._projectDelegates)
            this._projectDelegates[projectId].reset();
        this._projectDelegates = {};
    },

    __proto__: WebInspector.Object.prototype
}
