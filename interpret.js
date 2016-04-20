"use strict"
const id = x => x

const find = (xs, f) => {
  var found;
  for(let x in xs) {
    if(f(xs[x])) {
      found = xs[x]
      break;
    }
  }
  return found;
}

const dispatch = of => pairs =>
  instruction_of_arg => {
    const interpreter = (find(pairs, xs => // [type, interpreter]
        instruction_of_arg.constructor === xs[0]) || [null, of])[1]

    return interpreter(instruction_of_arg)
  }


module.exports = { dispatch }
