# Sequelize State Machine (Work in progress)

If you're familiar with my [AASM](https://github.com/aasm/aasm), then this is a similar take – just implemented in Sequelize v5 Model.
---

Usage Example
---

````
//model test.js

class Test extends Model {

    static states() {
        return [{"pending": {"initial": true}}, "active", {"inactive": {"final": true}}];
    }

    static stateTransitionIsStrict() {
        return true;
    }

    static statesTransition() {
        return {
            "activate": {
                "from": "pending",
                "to": "active"
            },
            "deactivate": {
                "from": ["pending", "active"],
                "to": "inactive"
            }
        };
    }

    async validateActive() {
        return true;
    }

    async beforeActive() {
        //some function here
    }

    async afterActive() {
        //some function here
    }
    
}

Test.init(
    {
        state: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Test',
        tableName: 'test',
        hooks: {
            async beforeCreate(model, options) {
               
            },
            async afterCreate(model, options) {

            },
            async beforeUpdate(model, options) {

            },
            async afterUpdate(model, options) {

            }
        }
        // options
    });


//place state machine after model init

stateMachine.addStates(Test.states())
    .addTransition(Test.statesTransition())
    .isStrict(Test.stateTransitionIsStrict())
    .stateField("state")
    .init(Test);

export default Test;

````

