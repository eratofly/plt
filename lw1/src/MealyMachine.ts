import {deepCopy} from './utils/deepCopy'
import {
	MooreMachine,
	MooreStates,
	MooreTransitions,
} from './MooreMachine'

export class MealyMachine {
	states: MealyStates
	startState: string

	constructor(states: MealyStates, startState: string = Object.keys(states)[0]) {
		this.states = states
		this.startState = startState
	}

	toMoore(): MooreMachine {
		const mooreStates: MooreStates = {}

		const startState = this.startState
		const startTransitions: MooreTransitions = {}
		Object.entries(this.states[startState]).forEach(([input, {output, nextState}]) => {
			startTransitions[input] = nextState + '/' + output
		})
		mooreStates[startState] = {
			output: '',
			transitions: startTransitions,
		}

		Object.entries(this.states).forEach(([state, transitions]) => {
			Object.entries(transitions).forEach(([input, {output, nextState}]) => {
				const newState = nextState + '/' + output
				if (!mooreStates[newState]) {
					const transitions: MooreTransitions = {}

					Object.entries(this.states[nextState]).forEach(([input, {output, nextState}]) => {
						transitions[input] = nextState + '/' + output
					})

					mooreStates[newState] = {
						output,
						transitions,
					}
				}
			})
		})

		return new MooreMachine(mooreStates, this.startState)
	}

	minimize() {
		this.removeDisconnectedNodes()

		let equivalences: EquivalenceClasses = {}
		let stateToEquivalence: StateToEquivalence = {}

		Object.keys(this.states).forEach(q => {
			const equivalence = Object.keys(this.states[q]).map(x => x + this.states[q][x].output).join(' ')
			if (!equivalences[equivalence])
				equivalences[equivalence] = []
			equivalences[equivalence].push(q)
			stateToEquivalence[q] = equivalence
		})

		let smashed = true
		while (smashed) {
			smashed = false
			let newEquivalences: EquivalenceClasses = {}
			let newStateToEquivalence: StateToEquivalence = {}
			for (const equivalenceName in equivalences) {
				const equivalence = equivalences[equivalenceName]
				equivalence.forEach(q => {
					const vectorOfEquivalences = Object.keys(this.states[q]).map(x => stateToEquivalence[this.states[q][x].nextState])
					const newEquivalenceName = equivalenceName + '->' + vectorOfEquivalences.join(' ')
					if (!newEquivalences[newEquivalenceName]) {
						newEquivalences[newEquivalenceName] = []
					}
					newEquivalences[newEquivalenceName].push(q)
					newStateToEquivalence[q] = newEquivalenceName
				})
			}

			if (Object.keys(newEquivalences).length !== Object.keys(equivalences).length) {
				smashed = true
			}

			equivalences = deepCopy(newEquivalences)
			stateToEquivalence = deepCopy(newStateToEquivalence)
		}

		console.log(equivalences)
		const duplicates = Object.keys(equivalences).flatMap(key => equivalences[key].slice(1))

		duplicates.forEach(duplicate => {
			delete this.states[duplicate]
		})
		Object.keys(this.states).forEach(q => {
			Object.keys(this.states[q]).forEach(x => {
				if (duplicates.includes(this.states[q][x].nextState)) {
					this.states[q][x].nextState = equivalences[stateToEquivalence[this.states[q][x].nextState]][0]
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
			Object.keys(this.states[state]).forEach(input => {
				const nextState = this.states[state][input].nextState
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

export type MealyStates = {
	[s: string]: MealyState
}

export type MealyState = {
	[x: string]: MealyTransition
}

export type MealyTransition = {
	nextState: string
	output: string
}
