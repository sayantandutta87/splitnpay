import Ember from "ember";

const { service } = Ember.inject;

export default Ember.Service.extend({
    syncQueue: service(),
    connection: service(),
    isOffline: Ember.computed.alias("connection.isOffline"),

    save(event, transaction) {
        if (transaction.get("isNew")) {
            event.get("transactions").pushObject(transaction);
        }

        return transaction.save().then((record) => {
            if (this.get("isOffline")) {
                const operation = transaction.get("isNew") ?
                          "createTransaction" : "updateTransaction";
                const payload = transaction.serialize({ includeId: true });

                this.get("syncQueue").enqueue(operation, payload);
            }

            return record;
        });
    },

    remove(transaction) {
        const event = transaction.get("event");
        const eventId = event.get("id");
        const id = transaction.get("id");

        event.get("transactions").removeObject(transaction);
        return event.save().then((res) => {
            if (this.get("isOffline")) {
                this.get("syncQueue").enqueue("removeTransaction", { eventId, id });
            }

            return res;
        });
    },
});
