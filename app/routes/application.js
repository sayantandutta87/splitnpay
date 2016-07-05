import Ember from "ember";

const { service } = Ember.inject;

export default Ember.Route.extend({
    modal: service(),
    offlineStore: service(),

    init() {
        this._super(...arguments);
        this.get("modal").on("show", this, "showModal");
        this.get("modal").on("remove", this, "removeModal");
    },

    model() {
        return Ember.RSVP.hash({
            currencies: this.store.findAll("currency"),
            previousEvents: this.get("offlineStore").findAll("event"),
        });
    },

    setupController() {
        this._super(...arguments);
        this.removePreloader();
    },

    showModal(options) {
        const model = this.modelFor("application");

        Object.assign(model, options);

        this.render(`modals/${options.name}`, {
            into: "application",
            outlet: "modal",
            model,
        });
    },

    removeModal() {
        this.disconnectOutlet({
            outlet: "modal",
            parentView: "application",
        });
    },

    removePreloader() {
        Ember.run.schedule("afterRender", this, function () {
            Ember.$("#preloader").remove();
        });
    },

    actions: {
        invokeAction(action) {
            action();
        },

        removeModal() {
            this.removeModal();
        },
    },
});
