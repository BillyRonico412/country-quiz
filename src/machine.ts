import { assign, createMachine, DoneInvokeEvent } from 'xstate'
import { z } from 'zod'

export const zodCountrie = z.object({
  name: z.object({
    common: z.string()
  }),
  flags: z.object({
    svg: z.string()
  }),
  capital: z.optional(z.array(z.string()))
})

interface MachineContext {
  allCountries: z.infer<typeof zodCountrie>[] | null
  points: number
  questionType: 0 | 1 | null
  question: string | null
  flag: string | null
  answers: string[]
  indexAnswer: number | null
  indexResponded: number | null
}

type MachineEvent =
  | {
      type: 'LOAD'
    }
  | {
      type: 'START'
    }
  | {
      type: 'PLAY'
      indexResponded: number
    }
  | {
      type: 'NEXT'
    }
  | {
      type: 'TRY_AGAIN'
    }

const machine =
  /** @xstate-layout N4IgpgJg5mDOIC5QFsCGBjAFgSwHZgDpsIAbMAYgBkB5AQQBEBtABgF1FQAHAe1mwBds3XBxAAPRAEYAbJIA0IAJ5SATAA4AvhoVoseQiW6oIeKOQjDCeAG7cA1oV058BQ8dMIb3dKkHCWrAGiPHx+IkjiiNIAzGoEkioArMzRzImSAOyJGWrySlLSzASJWjoYzgZGJrhmYABOddx1BJwkvgBmTcgETvquVR5ePmEBQREhAkLhoBIIACxqKgTMkonSSQrKCCoZkqUgvS71jXVUdExswbyTwqKzMnlbKuvF+4eEUKjIhK2oiqbkAAKlFoAE0xlxrmE7ogVABOJbSObMdaJTaINQrAgqFIJEraA7lPqfb4ELBgdB2AEQkATaERWaJFRzAio9EIDJzSTxObRFTwmTSIXSDJvIkuEmEcmU6mSdjjKFTGEIRLRRKsjb5BBqRJxRJwmKJLnCoWignvAiSggAdzw5AAcgBRAAaABUaXSlQzEFz1ZI1Fl2dI1NICHNVXixXoJV9KrAKE63R7FbdvSrFgROSp-YGtXC4RkwyiklGKgRYOgmhRXQAlUEAfVoAHFaABJe3J0JemZSaJw7EGgNovMFouorQE3DcCBwUTvK5d1M9hAAWkkzDm7Myr3N4qspDAC5u00iq7W7Oe-fxZWjlXcNSP9OXzxZal5ua26+vhNvBGOTUfbtT2iSRogIOE3z7ZgkgDNQ4RRdlojmUNwxAktd1-SVAKXYC4XZRJ0nAiN0JvMsrV+f4HwVRcT1mAN2RydUVlSHE1Gidj2LmUtiVjMlMApKkqMhGjlWRFkVCQ6IPwxZkw3hYMsm4mNSVtE9PRw2ZdnVBZ32HLYMlkVlJALOFBRNM1SJ40lDHjbDaMQLSw0g6TtWSAg30NY1zKUwgKyrOzRKxZlsyHdkIP7ZFxwnIA */
  createMachine<MachineContext, MachineEvent>(
    {
      id: 'machine',
      initial: 'idle',
      context: {
        allCountries: null,
        points: 0,
        questionType: null,
        question: null,
        flag: null,
        answers: [],
        indexAnswer: null,
        indexResponded: null
      },
      states: {
        idle: {
          on: {
            LOAD: 'loading'
          }
        },

        loading: {
          invoke: {
            src: 'loadCountries',
            onDone: {
              target: 'game',
              actions: assign((_, event: DoneInvokeEvent<z.infer<typeof zodCountrie>[]>) => ({
                allCountries: event.data
              }))
            },
            onError: {
              target: 'error'
            }
          }
        },

        error: {
          on: {
            LOAD: 'loading'
          }
        },

        game: {
          initial: 'playing',
          entry: assign({
            points: 0
          }),
          states: {
            playing: {
              entry: 'setQuestion',
              on: {
                PLAY: {
                  target: 'checking',
                  actions: assign((_, event) => ({
                    indexResponded: event.indexResponded
                  }))
                }
              }
            },

            checking: {
              always: [
                {
                  cond: (context) => {
                    return context.indexAnswer === context.indexResponded
                  },
                  actions: assign((context) => ({
                    points: context.points + 1
                  })),
                  target: 'win'
                },
                {
                  cond: (context) => {
                    return context.indexAnswer !== context.indexResponded
                  },
                  target: 'lose'
                }
              ]
            },

            win: {
              on: {
                NEXT: 'playing'
              }
            },

            lose: {
              on: {
                NEXT: '#machine.score'
              }
            }
          }
        },

        score: {
          on: {
            TRY_AGAIN: 'game'
          }
        }
      }
    },
    {
      services: {
        loadCountries: async (): Promise<z.infer<typeof zodCountrie>[]> => {
          const allCountriesRes = await fetch('https://restcountries.com/v3.1/all')
          const allCountries = await allCountriesRes.json()
          return z.array(zodCountrie).parse(allCountries)
        }
      },
      actions: {
        setQuestion: assign((context) => {
          if (context.allCountries !== null) {
            const questionType = Math.floor(Math.random() * 2)
            const indexCountry = Math.floor(Math.random() * context.allCountries.length)
            const country = context.allCountries[indexCountry]
            if (questionType === 0 && country.capital !== undefined) {
              const question = `${country.capital[0]} is capital of`
              const indexAnswer = Math.floor(Math.random() * 4)
              const answers: string[] = []
              for (let i = 0; i < 4; i++) {
                if (i === indexAnswer) {
                  answers.push(country.name.common)
                } else {
                  const indexOtherCountry = Math.floor(Math.random() * context.allCountries.length)
                  if (indexOtherCountry === indexCountry) {
                    i--
                    continue
                  }
                  const country = context.allCountries[indexOtherCountry]
                  answers.push(country.name.common)
                }
              }
              return {
                question,
                answers,
                indexAnswer,
                questionType,
                flag: null
              }
            } else {
              const question = `Which country does this flag belong to?`
              const flag = country.flags.svg
              const indexAnswer = Math.floor(Math.random() * 4)
              const answers: string[] = []
              for (let i = 0; i < 4; i++) {
                if (i === indexAnswer) {
                  answers.push(country.name.common)
                } else {
                  const indexOtherCountry = Math.floor(Math.random() * context.allCountries.length)
                  if (indexOtherCountry === indexCountry) {
                    i--
                    continue
                  }
                  const country = context.allCountries[indexOtherCountry]
                  answers.push(country.name.common)
                }
              }
              return { question, answers, indexAnswer, flag }
            }
          }
          return {}
        })
      }
    }
  )

export { machine }
