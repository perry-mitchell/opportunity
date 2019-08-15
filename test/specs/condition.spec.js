const { createCondition, createReaction } = require("../../source/condition.js");

function expectCondition(cond) {
    expect(cond).to.have.property("activate").that.is.a("function");
    expect(cond).to.have.property("cleanup").that.is.a("function");
    expect(cond).to.have.property("deactivate").that.is.a("function");
    expect(cond).to.have.property("isActivated").that.is.a("function");
    expect(cond).to.have.property("onActivated").that.is.a("function");
    expect(cond).to.have.property("onDeactivated").that.is.a("function");
}

describe("condition", function() {
    describe("createCondition", function() {
        it("returns a condition", function() {
            const cond = createCondition();
            expectCondition(cond);
        });

        describe("instance", function() {
            beforeEach(function() {
                this.condition = createCondition();
            });

            it("is not activated by default", function() {
                expect(this.condition.isActivated()).to.be.false;
            });

            it("can be activated", function() {
                this.condition.activate();
                expect(this.condition.isActivated()).to.be.true;
            });

            it("can be deactivated", function() {
                this.condition.activate();
                this.condition.deactivate();
                expect(this.condition.isActivated()).to.be.false;
            });

            it("fires events when activated", function() {
                const spy = sinon.spy();
                this.condition.onActivated(spy);
                this.condition.activate();
                expect(spy.callCount).to.equal(1);
            });

            it("fires events when deactivated", function() {
                const spy = sinon.spy();
                this.condition.onDeactivated(spy);
                this.condition.activate();
                this.condition.deactivate();
                expect(spy.callCount).to.equal(1);
            });
        });
    });

    describe("createReaction", function() {
        it("returns a condition", function() {
            const cond = createReaction(() => {});
            expectCondition(cond);
            cond.cleanup();
        });

        describe("instance", function() {
            it("reacts correctly to a callback method (falsy)", function(done) {
                const cond = createReaction(() => false, { delay: 50 });
                const spy = sinon.spy();
                cond.onDeactivated(spy);
                setTimeout(() => {
                    expect(cond.isActivated()).to.be.false;
                    cond.cleanup();
                    done();
                }, 200);
            });

            it("reacts correctly to a callback method (truthy)", function(done) {
                const cond = createReaction(() => true, { delay: 50 });
                const spy = sinon.spy();
                cond.onActivated(spy);
                setTimeout(() => {
                    expect(spy.callCount).to.equal(1);
                    expect(cond.isActivated()).to.be.true;
                    cond.cleanup();
                    done();
                }, 200);
            });
        });
    });
});
