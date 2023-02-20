import { useMachine } from '@xstate/react'
import { useEffect } from 'react'
import { machine } from './machine'

const App = (): JSX.Element => {
  const [state, send] = useMachine(machine)
  const { question, answers, flag, indexResponded, indexAnswer, points } = state.context
  useEffect(() => {
    send('LOAD')
  }, [send])
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="flex flex-col gap-y-2">
        <p className="text-2xl font-bold uppercase tracking-wide text-white">Country quiz</p>
        <div className="relative flex h-[450px] w-[350px] flex-col justify-evenly rounded-xl bg-white px-4 py-4">
          {state.matches('loading') && (
            <div className="flex items-center justify-center">
              <p className="animate-bounce text-sm font-bold text-[#2F527B]">Loading...</p>
            </div>
          )}
          {state.matches('error') && (
            <div className="flex items-center justify-center">
              <p className="text-sm font-bold text-[#EA8282]">Something went wrong</p>
            </div>
          )}
          {state.matches('game') && (
            <>
              <img
                src="/undraw_adventure.svg"
                alt="winner svg"
                className="absolute top-0 right-0 w-24 -translate-y-1/2"
              />
              <div className="flex h-1/6 items-center">
                {flag !== null && <img src={flag} alt="flag" className="w-[80px] shadow" />}
              </div>
              <p className="flex h-1/6 items-center text-sm font-bold text-[#2F527B]">{question}</p>
              <div className="flex h-1/2 flex-col justify-around">
                {answers.map((a, i) => {
                  const className = (() => {
                    if (state.matches({ game: 'win' })) {
                      if (indexResponded === i) {
                        return '!bg-[#60BF88] !text-white !hover:bg-[#60BF88] !hover:text-white !border-[#60BF88]'
                      } else {
                        return '!hover:bg-white !hover:text-[#6066D0] !hover:text-opacity-80 !hover:border-[#6066D0]'
                      }
                    } else if (state.matches({ game: 'lose' })) {
                      if (i === indexResponded) {
                        return '!bg-[#EA8282] !text-white !hover:bg-[#EA8282] !hover:text-white !border-[#EA8282]'
                      } else if (i === indexAnswer) {
                        return '!bg-[#60BF88] !text-white !hover:bg-[#60BF88] !hover:text-white !border-[#60BF88]'
                      } else {
                        return '!hover:bg-white !hover:text-[#6066D0] !hover:text-opacity-80 hover:border-[#6066D0]'
                      }
                    }
                    return ''
                  })()
                  return (
                    <button
                      key={i}
                      className={
                        'flex gap-x-6 truncate rounded-lg border border-[#6066D0] border-opacity-80 bg-white px-4 py-2 text-left text-sm font-medium text-[#6066D0] text-opacity-80 transition-colors hover:border-white hover:bg-[#F9A826] hover:text-white ' +
                        className
                      }
                      onClick={() =>
                        send({
                          type: 'PLAY',
                          indexResponded: i
                        })
                      }>
                      <span>{String.fromCharCode(65 + i)}</span> <span>{a}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex h-1/6 items-center">
                {[{ game: 'win' }, { game: 'lose' }].some(state.matches) && (
                  <button
                    className="ml-auto rounded bg-[#F9A826] px-6 py-2 font-bold text-white"
                    onClick={() => send('NEXT')}>
                    Next
                  </button>
                )}
              </div>
            </>
          )}
          {state.matches('score') && (
            <div className="flex flex-col items-center justify-center gap-y-6">
              <img src="/undraw_winners.svg" alt="winner svg" className="mb-auto w-36" />
              <div className="flex flex-1 flex-col items-center gap-y-2">
                <p className="text-2xl font-bold text-[#2F527B]">Results</p>
                <p className="flex items-center gap-x-2 text-sm font-bold tracking-wide text-[#2F527B]">
                  You got <span className="text-2xl text-[#60BF88]">{points}</span> correct answers.
                </p>
                <button
                  className="mt-4 rounded bg-[#F9A826] px-6 py-2 font-bold text-white"
                  onClick={() => send('TRY_AGAIN')}>
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="absolute bottom-2 text-xs font-medium text-[#F2F2F2]">
        created by{' '}
        <a href="https://devchallenges.io/portfolio/BillyRonico412" className="font-bold underline">
          BillyRonico412
        </a>{' '}
        - devChallenges.io
      </p>
    </div>
  )
}

export default App
