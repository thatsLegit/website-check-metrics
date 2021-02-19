class FiniteStateMachine {
    constructor() {
        this._states = {};
        this._currentState = null;
    }

    _AddState(name, type) {
        this._states[name] = type;
    }

    SetState(name, data=null) {
        const prevState = this._currentState;

        if (prevState) {
            if (prevState.Name == name) return;
            prevState.Exit(data);
        }

        const state = new this._states[name](this);

        this._currentState = state;
        state.Enter(prevState, data);
    }

    Update(alert) {
        if (this._currentState) this._currentState.Update(alert);
    }
}

module.exports = FiniteStateMachine;