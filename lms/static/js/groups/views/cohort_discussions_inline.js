var edx = edx || {};

(function ($, _, Backbone, gettext, interpolate_text, CohortDiscussionConfigurationView) {
    'use strict';

    edx.groups = edx.groups || {};

    edx.groups.InlineDiscussionsView = CohortDiscussionConfigurationView.extend({
        events: {
            'change .check-discussion-category': 'setSaveButton',
            'change .check-discussion-subcategory-inline': 'setSaveButton',
            'click .cohort-inline-discussions-form .action-save': 'saveInlineDiscussionsForm',
            'change .check-all-inline-discussions': 'setAllInlineDiscussions',
            'change .check-cohort-inline-discussions': 'setSomeInlineDiscussions'
        },

        initialize: function (options) {
            this.template = _.template($('#cohort-discussions-inline-tpl').text());
            this.cohortSettings = options.cohortSettings;
        },

        render: function () {
            var alwaysCohortInlineDiscussions = this.cohortSettings.get('always_cohort_inline_discussions');

            this.$('.cohort-inline-discussions-nav').html(this.template({
                inlineDiscussionTopics: this.getInlineDiscussionsHtml(this.model.get('inline_discussions')),
                alwaysCohortInlineDiscussions:alwaysCohortInlineDiscussions
            }));

            // Provides the semantics for a nested list of tri-state checkboxes.
            // When attached to a jQuery element it listens for change events to
            // input[type=checkbox] elements, and updates the checked and indeterminate
            // based on the checked values of any checkboxes in child elements of the DOM.
            this.$('ul.inline-topics').qubit();

            this.setElementsEnabled(alwaysCohortInlineDiscussions, true);
        },

        /**
         * Generate html list for inline discussion topics.
         * @params {object} inlineDiscussions - inline discussions object from server.
         * @returns {Array} - HTML for inline discussion topics.
         */
        getInlineDiscussionsHtml: function (inlineDiscussions) {
            var categoryTemplate = _.template($('#cohort-discussions-category-tpl').html()),
                entryTemplate = _.template($('#cohort-discussions-subcategory-tpl').html()),
                isCategoryCohorted = false,
                children = inlineDiscussions.children,
                entries = inlineDiscussions.entries,
                subcategories = inlineDiscussions.subcategories;

            return _.map(children, function (name) {
                var html = '', entry;
                if (entries && _.has(entries, name)) {
                    entry = entries[name];
                    html = entryTemplate({
                        name: name,
                        id: entry.id,
                        is_cohorted: entry.is_cohorted,
                        type: 'inline'
                    });
                } else { // subcategory
                    html = categoryTemplate({
                        name: name,
                        entries: this.getInlineDiscussionsHtml(subcategories[name]),
                        isCategoryCohorted: isCategoryCohorted
                    });
                }
                return html;
            }, this).join('');
        },

        /**
         * Enable/Disable the inline discussion elements.
         *
         * Disables the category and sub-category checkboxes.
         * Enables the save button.
         */
        setAllInlineDiscussions: function(event) {
            event.preventDefault();
            this.setElementsEnabled(($(event.currentTarget).prop('checked')), false);
        },

        /**
         * Enables the inline discussion elements.
         *
         * Enables the category and sub-category checkboxes.
         * Enables the save button.
         */
        setSomeInlineDiscussions: function(event) {
            event.preventDefault();
            this.setElementsEnabled(!($(event.currentTarget).prop('checked')), false);
        },

        /**
         * Enable/Disable the inline discussion elements.
         *
         * Enable/Disable the category and sub-category checkboxes.
         * Enable/Disable the save button.
         * @param {bool} enable_checkboxes - The flag to enable/disable the checkboxes.
         * @param {bool} enable_save_button - The flag to enable/disable the save button.
         */
        setElementsEnabled: function(enable_checkboxes, enable_save_button) {
            this.setDisabled(this.$('.check-discussion-category'), enable_checkboxes);
            this.setDisabled(this.$('.check-discussion-subcategory-inline'), enable_checkboxes);
            this.setDisabled(this.$('.cohort-inline-discussions-form .action-save'), enable_save_button);
        },

        /**
         * Enables the save button for inline discussions.
         */
        setSaveButton: function(event) {
            this.setDisabled(this.$('.cohort-inline-discussions-form .action-save'), false);
        },

        /**
         * Sends the cohorted_inline_discussions to the server and renders the view.
         */
        saveInlineDiscussionsForm: function (event) {
            event.preventDefault();

            var self = this,
                cohortedInlineDiscussions = self.getCohortedDiscussions(
                    '.check-discussion-subcategory-inline:checked'
                ),
                fieldData= {
                    cohorted_inline_discussions: cohortedInlineDiscussions,
                    always_cohort_inline_discussions: self.$('.check-all-inline-discussions').prop('checked')
                };

            self.saveForm(self.$('.inline-discussion-topics'), fieldData)
                .done(function () {
                    self.model.fetch()
                        .done(function () {
                            self.render();
                            self.showMessage(gettext('Your changes have been saved.'), self.$('.inline-discussion-topics'));
                        }).fail(function() {
                            var errorMessage = gettext("We've encountered an error. Refresh your browser and then try again.");
                            self.showMessage(errorMessage, self.$('.inline-discussion-topics'), 'error')
                        });
                });
        }

    });
}).call(this, $, _, Backbone, gettext, interpolate_text, edx.groups.CohortDiscussionConfigurationView);
