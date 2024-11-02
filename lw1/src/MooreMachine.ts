import {deepCopy} from './utils/deepCopy'
import {
	MealyMachine,
	MealyStates,
} from './MealyMachine'

export class MooreMachine {
	public states: MooreStates
	startState: string

	constructor(states: MooreStates, startState: string = Object.keys(states)[0]) {
		this.states = states
		this.startState = startState
	}

	toMealy(): MealyMachine {
		const mealyStates: MealyStates = {}
		Object.entries(this.states).forEach(([state, {transitions}]) => {
			mealyStates[state] = {}
			Object.entries(transitions).forEach(([input, nextState]) => {
				mealyStates[state][input] = {
					output: this.states[nextState].output,
					nextState,
				}
			})
		})
		return new MealyMachine(mealyStates, this.startState)
	}

	minimize() {
		this.removeDisconnectedNodes()

		let equivalences: EquivalenceClasses = {}
		let stateToEquivalence: StateToEquivalence = {}

		Object.entries(this.states).forEach(([state, {output}]) => {
			const equivalence = output
			if (!equivalences[equivalence])
				equivalences[equivalence] = []
			equivalences[equivalence].push(state)
			stateToEquivalence[state] = equivalence
		})

		let smashed = true
		while (smashed) {
			smashed = false
			let newEquivalences: EquivalenceClasses = {}
			let newStateToEquivalence: StateToEquivalence = {}
			for (const equivalenceName in equivalences) {
				const equivalence = equivalences[equivalenceName]
				equivalence.forEach(state => {
					const vectorOfEquivalences = Object.keys(this.states[state].transitions).map(x => stateToEquivalence[this.states[state].transitions[x]])
					const newEquivalenceName = equivalenceName + '->' + vectorOfEquivalences.join(' ')
					if (!newEquivalences[newEquivalenceName]) {
						newEquivalences[newEquivalenceName] = []
					}
					newEquivalences[newEquivalenceName].push(state)
					newStateToEquivalence[state] = newEquivalenceName
				})
			}

			if (Object.keys(newEquivalences).length !== Object.keys(equivalences).length) {
				smashed = true
			}

			equivalences = deepCopy(newEquivalences)
			stateToEquivalence = deepCopy(newStateToEquivalence)
		}

		const duplicates = Object.keys(equivalences).flatMap(key => equivalences[key].slice(1))

		duplicates.forEach(duplicate => {
			delete this.states[duplicate]
		})
		Object.keys(this.states).forEach(q => {
			Object.keys(this.states[q].transitions).forEach(x => {
				if (duplicates.includes(this.states[q].transitions[x])) {
					this.states[q].transitions[x] = equivalences[stateToEquivalence[this.states[q].transitions[x]]][0]
				}
			})
		})
		if (this.startState && duplicates.includes(this.startState)) {
			this.startState = equivalences[stateToEquivalence[this.startState]][0]
		}
	}

	removeDisconnectedNodes(): void {
		const stack: Array<string> = [this.startState]
		const visited: Set<string> = new Set(stack)

		while (stack.length) {
			const state = stack.pop()!
			Object.keys(this.states[state].transitions).forEach(input => {
				const nextState = this.states[state].transitions[input]
				if (!visited.has(nextState)) {
					visited.add(nextState)
					stack.push(nextState)
				}
			})
		}

		Object.keys(this.states).forEach(state => {
			if (!visited.has(state)) {
				delete this.states[state]
			}
		})
	}
}

type EquivalenceClasses = { [equivalence: string]: Array<string> }
type StateToEquivalence = { [state: string]: string }

export type MooreStates = {
	[s: string]: MooreState
}

export type MooreState = {
	output: string
	transitions: MooreTransitions
}

export type MooreTransitions = {
	[x: string]: string
}
