import {MachineReader} from '../../reader/MachineReader'
import {MachineDotWriter} from '../../MachineDotWriter/MachineDotWriter'
import path from 'node:path'

const inputFilePathStr = process.argv[2] ?? `${__dirname}/mealy.csv`
const outputFilePathStr = process.argv[3] ?? `${__dirname}/output.dot`

const machine = MachineReader.read(inputFilePathStr)
MachineDotWriter.write(machine, path.join(path.dirname(outputFilePathStr), 'input.dot'))

machine.minimize()

MachineDotWriter.write(machine, outputFilePathStr)
