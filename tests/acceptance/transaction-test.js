import { test } from "qunit";
import moduleForAcceptance from "splittypie/tests/helpers/module-for-acceptance";
import Ember from "ember";

moduleForAcceptance("Acceptance | transaction");

test("adding new transaction", function (assert) {
    let event;

    waitForPromise(new Ember.RSVP.Promise((resolve) => {
        Ember.run(() => {
            this.store.findRecord("currency", "USD").then((currency) => {
                event = this.store.createRecord("event", {
                    name: "Test event",
                    currency,
                    users: [
                        this.store.createRecord("user", { name: "Alice" }),
                        this.store.createRecord("user", { name: "Bob" }),
                    ],
                });
                event.save().then(resolve);
            });
        });
    }));
    andThen(() => {
        identifyUserAs(event.id, "Bob");
        visit(`/${event.id}/transactions`);
    });

    reloadPage();
    andThen(() => {
        assert.ok(exist("div:contains('There are no transactions yet')"), "No transactions text");
        assert.ok(exist("div:contains('Add your first transaction')"), "Transaction onboarding");
    });

    click("a.btn-add-transaction");
    // defaults
    andThen(() => {
        assert.equal(
            find(".transaction-participants input:checked").length,
            2,
            "Everyone selected by default"
        );
    });

    andThen(() => {
        const AliceId = find(".transaction-payer select option:contains('Alice')").val();

        fillIn(".transaction-payer", AliceId);
        fillIn(".transaction-name", "special bottle of vodka");
        fillIn(".transaction-amount", "50");
        click("button:contains('Create')");
    });

    reloadPage();
    // check for transaction
    andThen(() => {
        const expectedMessage = "Alice paid for special bottle of vodka";

        assert.ok(exist(".transaction-list-item:contains('50 USD')"), "transaction amount");
        assert.ok(
            exist(`.transaction-list-item:contains('${expectedMessage}')`),
            "transaction item"
        );
        assert.notOk(
            exist("div:contains('Add your first transaction')"),
            "No Transaction onboarding text"
        );
    });
});

test("editing/removing transaction", function (assert) {
    let event;

    waitForPromise(new Ember.RSVP.Promise((resolve) => {
        Ember.run(() => {
            this.store.findRecord("currency", "USD").then((currency) => {
                const alice = this.store.createRecord("user", { name: "Alice" });
                const bob = this.store.createRecord("user", { name: "Bob" });
                const transaction = this.store.createRecord("transaction", {
                    name: "Gift",
                    payer: alice,
                    amount: 200,
                    participants: [alice, bob],
                });
                event = this.store.createRecord("event", {
                    name: "Test event",
                    currency,
                    users: [alice, bob],
                    transactions: [transaction],
                });
                event.save().then(resolve);
            });
        });
    }));
    andThen(() => {
        identifyUserAs(event.id, "Bob");
        visit(`/${event.id}/transactions`);
    });

    reloadPage();
    andThen(() => {
        assert.ok(exist(".transaction-list-item:contains('200 USD')"), "transaction amount");
        assert.ok(
            exist(".transaction-list-item:contains('Alice paid for Gift')"),
            "transaction item"
        );
        assert.ok(exist(".transaction-list-item:contains('Alice, Bob')"));
    });

    click(".transaction-list-item");
    andThen(() => {
        const BobId = find(".transaction-payer select option:contains('Bob')").val();

        fillIn(".transaction-payer", BobId);
        fillIn(".transaction-name", "special");
        fillIn(".transaction-amount", "50");
        click("button:contains('Save')");
    });

    reloadPage();
    andThen(() => {
        assert.ok(exist(".transaction-list-item:contains('50 USD')"), "transaction amount");
        assert.ok(
            exist(".transaction-list-item:contains('Bob paid for special')"),
            "transaction item"
        );
        assert.ok(exist(".transaction-list-item:contains('Alice, Bob')"));
    });

    click(".transaction-list-item");
    click("button.delete-transaction");

    andThen(() => {
        assert.ok(exist("div:contains('Are you sure?')"), "delete confirmation");
    });
    click("button:contains('Yes')");
    andThen(() => {
        assert.ok(exist("div:contains('There are no transactions yet')"), "No transactions text");
    });
});
