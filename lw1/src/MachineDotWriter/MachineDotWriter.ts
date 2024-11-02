import {writeFileSync} from 'node:fs'
import {MealyMachine} from '../MealyMachine'
import {MooreMachine} from '../MooreMachine'

export class MachineDotWriter {
	static write(machine: MealyMachine | MooreMachine, pathStr: string): void {
		const dotStr = machine instanceof MealyMachine
			? MachineDotWriter.getMealy(machine)
			: MachineDotWriter.getMoore(machine)

		writeFileSync(pathStr, dotStr)
	}

	static getMealy(machine: MealyMachine): string {
		const states = Object.keys(machine.states).map(state => {
			return `"${state}" [label = "${state}"]\n`
		}).join('')
		const dotTransitions = Object.entries(machine.states).flatMap(([state, transitions]) =>
			Object.entries(transitions).map(([input, {output, nextState}]) => {
				return `"${state}" -> "${nextState}" [label = "${input}/${output}"];\n`
			})
		).join('')
		const data = `${states}\n${dotTransitions}`
		return `digraph machine {\n${data}}`
	}

	static getMoore(machine: MooreMachine): string {
		const states = Object.entries(machine.states).map(([state, {output}]) => {
			const label = !output || state.endsWith(`/${output}`)
				? state
				: `${state}/${output}`
			return `"${state}" [label = "${label}"]\n`
		}).join('')
		const dotTransitions = Object.entries(machine.states).flatMap(([state, {output, transitions}]) =>
			Object.entries(transitions).map(([input, nextState]) => {
				return `"${state}" -> "${nextState}" [label = "${input}"];\n`
			})
		).join('')
		const data = `${states}\n${dotTransitions}`
		return `digraph machine {\n${data}}`
	}
}
