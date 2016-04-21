const Task = require('data.task')
const {IOType, IO} = require('./io')
const {Either, Left, Right} = require('./either')
const {Maybe, Just, Nothing} = require('./maybe')
const {ContType, Cont} = require('./cont')
const {State} = require('./state')
const {dispatch} = require('./interpret')
const Monad = require('./monad')
const test = require('tape')

// some nt's, but where to stash these?
const maybeToTask = m => m.fold(Task.of, Task.rejected)
const contToTask = c => c.t
const eitherToTask = m => m.fold(Task.rejected, Task.of)
const ioToTask = i => new Task((rej, res) => res(i.f()))

const equalAndEnd = t => message => expected => actual => {
  t.equal(actual, expected, message)
  t.end()
}

// either Example
const gtZero = x =>
  (x > 0) ? Right(x) : Left("it was less than zero")

// cont example (cont just wraps task. prob a misnomer)
const asyncGet = n =>
  Cont((rej, res) => setTimeout(() => res(n), 100))

// this tells our Free.foldMap how to dispatch. We need all of them to turn into a target monad (in this case Task)
const runApp = dispatch(Task.of)
  ( [ [IOType, ioToTask]
    , [ContType, contToTask]
    , [Either, eitherToTask]
    , [Maybe, maybeToTask]
    ]
  )

test('gives us 10', t => {
  // do syntax works for any 1 monad. Since it's all in Free, we can use multiple
  const app = Monad.do(function *() {
    const ioNumber = yield IO(() => 1)
    const maybeNumber = yield Just(2)
    const contNumber = yield asyncGet(3)
    const eitherNumber = yield gtZero(4)
    return Monad.of(ioNumber + maybeNumber + eitherNumber + contNumber)
  })

  app.foldMap(runApp).fork(t.fail, equalAndEnd(t)("it's 10!")(10))
})

test('give us 14', t =>
  // do syntax is much nicer
  gtZero(10)
  .chain(ten => {
      return asyncGet(4).map(four => {
        return ten + four}) })
  .foldMap(runApp).fork(t.fail, equalAndEnd(t)("it's 14")(14))
)

test('gives us error string', t => {
  gtZero(0).chain(() => asyncGet(4))
    .foldMap(runApp).fork
      ( equalAndEnd(t)("it failed!")("it was less than zero")
      , t.fail
      )
})

test('ap works in parallel', t => {
  t.timeoutAfter(300)
  const second = asyncGet(1)
  const app = second.map(() => () => () => true).ap(second).ap(second)
  app.foldMap(runApp).fork(t.fail, equalAndEnd(t)('happened fast!')(true))
})

test('works without ap/map defined', t => {
  delete Task.prototype.map
  delete Task.prototype.ap
  const second = asyncGet(1)
  const app = second.map(() => () => () => true).ap(second).ap(second)
  app.foldMap(runApp).fork(t.fail, equalAndEnd(t)('still works!')(true))
})

