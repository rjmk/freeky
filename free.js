const daggy = require('daggy')

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

Free.prototype.foldMap = function(interpreter, of) {
  return this.fs.reduce(interpretStep(interpreter), interpreter(this.x))
}

const interpretStep = interpreter => (monad, call) =>
  monad[call.method](interpreterUses[call.method](interpreter)(call.arg))

var interpreterUses =
  { 'map': () => id
  , 'ap': f => free => f(free.x)
  , 'chain': (f, of) => g => a => g(a).foldMap(f, of)
  }

module.exports = { liftF, Free }
