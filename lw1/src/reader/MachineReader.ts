import {
	MealyMachine,
	MealyStates,
} from '../MealyMachine'
import {
	MooreMachine,
	MooreStates,
} from '../MooreMachine'
import * as fs from 'node:fs'
import Papa from 'papaparse'

export class MachineReader {
	static read(pathStr: string): MealyMachine | MooreMachine {
		const csvString = fs.readFileSync(pathStr, {
			encoding: 'utf-8',
		})
		return MachineReader.parse(csvString)
	}

	static parse(csvString: string): MealyMachine | MooreMachine {
		const parsedTable = Papa.parse(csvString.trim())
		if (parsedTable.errors.length) {
			throw new Error('invalid format')
		}
		const data = parsedTable.data as string[][]

		if (data[0][1] === 'input') {
			return MachineReader.parseMealy(data.slice(1))
		}

		if (data[0][1] === 'output') {
			return MachineReader.parseMoore(data.slice(1))
		}

		return new MooreMachine({})
	}

	private static parseMealy(data: string[][]) {
		const states: MealyStates = {}

		data.forEach(row => {
			const [state, input, nextState, output] = row

			if (!states[state]) {
				states[state] = {}
			}

			if (states[state][input]) {
				throw new Error('Indeterministic machine')
			}

			states[state][input] = {
				nextState,
				output,
			}
		})

		return new MealyMachine(states)
	}

	private static parseMoore(data: string[][]) {
		const states: MooreStates = {}

		data.forEach(row => {
			const [state, output, input, nextState] = row

			if (!states[state]) {
				states[state] = {
					output,
					transitions: {}
				}
			}

			states[state].transitions[input] = nextState
		})

		return new MooreMachine(states)
	}
}
