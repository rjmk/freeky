const daggy = require('daggy')
const fallback = require('fantasy-derivations')

const id = x => x

const Free = daggy.tagged('x', 'fs')
const Call = daggy.tagged('method', 'arg')

const method = function (name) {
  return function (arg) {
    return Free(this.x, this.fs.concat(Call(name, arg)))
  }
}

Free.prototype.fold = function() {
  return this.x.fold.apply(this.x, arguments)
}

var methods = [ 'map', 'ap', 'chain' ]

methods.forEach(name => Free.prototype[name] = method(name))

const liftF = command => Free(command, [])

Free.prototype.foldMap = function(interpreter) {
  return this.fs.reduce(interpretStep(interpreter), interpreter(this.x))
}

const interpretStep = interpreter => (monad, call) => {
  const method = fallback(call.method, monad)
  return method(interpreterUses[call.method](interpreter)(call.arg))
}

const interpreterUses =
  { 'map': _ => id
  , 'ap': f => free => f(free.x)
  , 'chain': f => g => a => g(a).foldMap(f)
  }

module.exports = { liftF, Free }
