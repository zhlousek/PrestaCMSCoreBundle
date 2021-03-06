/**
 * CMSContent : Manage CMS content administration for themes and pages
 * 
 * @package    PrestaCMS
 * @subpackage CoreBundle
 * @author     Nicolas Bastien <nbastien@prestaconcept.net>
 */
var CMSContent = function() {
    
    /**
     * Url for bloc edition
     */
    var _editBlocUrl;

    /**
     * Url for bloc addition
     */
    var _addBlocUrl;

    /**
     * Url for bloc deletion
     */
    var _deleteBlocUrl;
    
    /**
     * Url for block rendering
     */
    var _renderBlockUrl;

    /**
     * Url for block rendering
     */
    var _addPageUrl;

    return {
        /**
         * Initialisation
         */
        init : function (editBlocUrl, renderBlockUrl, addBlockUrl, deleteBlockUrl, addPageUrl) {
            this._editBlocUrl       = editBlocUrl;
            this._renderBlockUrl    = renderBlockUrl;
            this._addBlocUrl        = addBlockUrl;
            this._deleteBlocUrl     = deleteBlockUrl;
            this._addPageUrl        = addPageUrl;
            
            $('body').on('click', 'a.action-edit', function(e) {
                e.preventDefault();
                CMSContent.editBlock($(this).attr('block-id'));
            });

            $('body').on('click', 'a.action-add', function(e) {
                e.preventDefault();
                CMSContent.addBlock($(this).attr('zone-id'), $(this).attr('type'));
            });

            $('body').on('click', 'a.action-container-add', function(e) {
                e.preventDefault();
                CMSContent.addContainerBlock($(this).attr('block-id'), $(this).attr('type'));
            });

            $('body').on('click', 'a.action-delete', function(e) {
                e.preventDefault();
                CMSContent.deleteBlock($(this).attr('block-id'), $(this).attr('block-title'));
            });

            $('body').on('click', 'a.action-add-page', function(e) {
                e.preventDefault();
                CMSContent.addPage($(this).attr('root-id'));
            });

            // $( ".page-zone-block-container" ).sortable(
            //     { cursor: "move" }
            // );
            // $( ".page-zone-block-container" ).disableSelection();
        },

        /**
         * Return url for block rendering
         */
        getRenderBlocUrl : function (blockId) {
            return this._renderBlockUrl + '?id=' + blockId;
        },

        /**
         * Handle block edit button click
         * Load Modal Edition
         */
        editBlock : function (blockId) {
            $('#modal-loader').show();
            $('#modal-content').html('');
            $('#modal-content').hide();
            $('#modal').modal('show');
            
            $('#modal-content').load(this._editBlocUrl + '&id=' + blockId, function() {
                $('#modal-content div.form-actions').remove();
                $('#modal-loader').hide();
                $('#modal-content').show();
                initWysiwyg();
            });
        },

        /**
         * Handle block add button click
         * Load Modal
         */
        addBlock : function (zoneId, type) {
            $('#modal-loader').show();
            $('#modal-content').html('');
            $('#modal-content').hide();
            $('#modal').modal('show');

            $('#modal-content').load(this._addBlocUrl + '?zoneId=' + zoneId + '&type=' + type, function() {
                $('#modal-content div.form-actions').remove();
                $('#modal-loader').hide();
                $('#modal-content').show();
            });
        },

        /**
         * Handle block add button click
         * Load Modal
         */
        addContainerBlock : function (blockId, type) {
            $('#modal-loader').show();
            $('#modal-content').html('');
            $('#modal-content').hide();
            $('#modal').modal('show');

            $('#modal-content').load(this._addBlocUrl + '?blockId=' + blockId + '&type=' + type, function() {
                $('#modal-content div.form-actions').remove();
                $('#modal-loader').hide();
                $('#modal-content').show();
            });
        },

        /**
         * Handle block add button click
         * Load Modal
         */
        deleteBlock : function (blockId, message) {
            if (confirm('Do you really want to delete : ' + message)) {
                $.ajax({
                    url: this._deleteBlocUrl + '?id=' + blockId,
                    type: "POST",
                    data: {}
                }).done(function( html ) {
                    if (html.result != undefined) {
                        var blockContainerId = html.block.replace(/\//g, '');
                        blockContainerId = blockContainerId.replace(/\_/g, '');
                        blockContainerId = '#block-content-' + blockContainerId.replace(/\./g, '');

                        if (html.content != undefined) {
                            $(blockContainerId).parent('.page-zone-block').html(html.content);
                            $(blockContainerId).effect("highlight", {}, 3000);
                        } else {
                            $(blockContainerId).parent().remove();

                            var zoneContainerId = html.zone.replace(/\//g, '');
                            zoneContainerId = zoneContainerId.replace(/\_/g, '');
                            zoneContainerId = '#cms-zone-' + zoneContainerId.replace(/\./g, '');
                            $(zoneContainerId).effect("highlight", {}, 3000);
                        }
                    }
                });
            }
        },

        /**
         * Add a new page
         */
        addPage: function (rootId) {
            $('#modal-loader').show();
            $('#modal-content').html('');
            $('#modal-content').hide();
            $('#modal').modal('show');

            var url = this._addPageUrl;
            if (rootId != undefined) {
                url += '?rootId=' + rootId;
            }

            $('#modal-content').load(url, function() {
                $('#modal-content div.form-actions').remove();
                $('#modal-loader').hide();
                $('#modal-content').show();
            });
        },

        /**
         * Submit Modal Edition form and update content
         */
        submitModalForm : function () {
            $('#modal-content').hide();
            $('#modal-loader').show();

            // déclenche la sauvegarde du Tiny
            wysiwygTriggerSave();

            $.ajax({
                url: $('#modal form').attr('action'),
                type: "POST",
                data: $('#modal form').serialize()
            }).done(function( html ) {
                //If succesfull we only get a return code in JSON
                if (html.result != undefined) {

                    if (html.action == 'refresh') {
                        return document.location = html.location;
                    }

                    $('#modal-content').html('');
                    $('#modal').modal('hide');
                    CMSContentInit();

                    if (html.action == undefined) {
                        html.action = 'edit';
                    }

                    if (html.action == 'add') {
                        if (html.zone != undefined) {
                            // add block in zone
                            var parentBlockId   = html.zone.replace(/\//g, '');
                            parentBlockId       = parentBlockId.replace(/\_/g, '');
                            parentBlockId       = '#cms-zone-' + parentBlockId.replace(/\./g, '');
                            parentBlock         = $(parentBlockId);

                        } else {
                            // add block in container
                            var parentBlockId   = html.objectId.replace(/\//g, '');
                            parentBlockId       = parentBlockId.replace(/\_/g, '');
                            parentBlockId       = '#block-content-' + parentBlockId.replace(/\./g, '');

                            // override add button
                            parentBlock         = $(parentBlockId).parent('div').parent('div');
                            parentBlock.html('');
                        }

                        parentBlock.append(html.content);
                        parentBlock.effect("highlight", {}, 3000);

                    } else if (html.action == 'edit') {
                        // refresh block after edit action
                        var parentBlockId    = html.objectId.replace(/\//g, '');
                        parentBlockId        = parentBlockId.replace(/\_/g, '');
                        parentBlockId        = '#block-content-' + parentBlockId.replace(/\./g, '');

                        $(parentBlockId).load(CMSContent.getRenderBlocUrl(html.objectId), function() {
                            $(parentBlockId).effect("highlight", {}, 3000);
                        });
                    }

                } else {
                    //If an error occurs, we rediplay the form
                    $('#modal-content').html(html);
                    $('#modal-loader').hide();
                    $('#modal-content').show();
                }
            });
        }    
    }
}();
