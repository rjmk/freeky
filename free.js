const daggy = require('daggy')

const Free = daggy.taggedSum({Impure: ['x', 'f'], Pure: ['x']})
const {Impure, Pure} = Free

Free.of = Pure

const kleisli_comp = (f, g) => x => f(x).chain(g)

Free.prototype.fold = function() {
  return this.x.fold.apply(this.x, arguments)
}


Free.prototype.map = function(f) {
  return this.cata({
    Impure: (x, g) => Impure(x, y => g(y).map(f)),
    Pure: x => Pure(f(x))
  })
}

Free.prototype.ap = function(a) {
  return this.x.ap ? this.x.ap(a) : this.chain(f => a.map(f))
}

Free.prototype.chain = function(f) {
  return this.cata({
    Impure: (x, g) => Impure(x, kleisli_comp(g, f)),
    Pure: x => f(x)
  })
}

const liftF = command => Impure(command, Pure)

Free.prototype.foldMap = function(interpreter, of) {
  return this.cata({
    Pure: a => of(a),
    Impure: (intruction_of_arg, next) =>
      interpreter(intruction_of_arg).chain(result =>
        next(result).foldMap(interpreter, of))
  })
}

module.exports = { liftF, Free }
