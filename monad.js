const lift = require('./free').liftF

const Monad = {
  do: gen => {
    const g = gen()
    const step = value => {
      const result = g.next(value)
      return result.done ?
            result.value :
            result.value.chain(step)
    }
    return step()
  },
  of: lift
}

module.exports = Monad
