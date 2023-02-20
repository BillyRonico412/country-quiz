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
  /** @xstate-layout N4IgpgJg5mDOIC5QFsCGBjAFgSwHZgDpsIAbMAYgBkB5AQQBEBtABgF1FQAHAe1mwBds3XBxAAPRABYAzAA4CAdgCMcgKzMlzSc1kBOWdIA0IAJ6IATJPlyFM3dNULdCx6oC+b42ix5CJbqgQeFDkEMKEeABu3ADWhN44+AT+gcEIUdzoqILCLKx5ojx8OSJI4oi6SgBsBKq66pJKjY1OksZmCObmCgTVOnUqVXI6Hl4YiX4BQbghYABOc9xzBJwk2QBmS8gECb7JU2kZWSV5BWVFAkKloBIITrqKkt1DjuaaSubtiEoK5gTOLVk5lkv1UklsoxAuyS80WcyodCYbEKvEuwlEtxk8mUckkTy6liUSi+CB+SgI4MaenMDns-Uh0MIUFQyEIq1QJmC5AACpRaABNM5cVElDGIMHSAjMOTSSSqIH6bSqElgh7SaRdEFgqqNZhVBnjPbM1kELBgdAxLlCkAXUVlW5OcmaHRPewKFyyEngyWqKpVargvV1ZQGnxJY2EM0Wq1KdjnEVXMV3FxSrpVSq6GmyJRAlWyZiKcyqVTqp7qn66UMTAgRggAdzw5AAcgBRAAaABVrbbE-bEH7VLVZKoc9JpUHZV6urUPlpzP7qrp-VWjSzJrAKK3O92E+i+wh6n8VPpZFUtES-STbIOS9qT28hgoV0lYOglhQOwAlfkAfVoAHFaAASSbHdil7G5EGkP1ajpQMR3VN4rzlWoHEkextHqeV3EhXBuAgOBREZFFwL3SDOkaAhoPnJoVA1McHBJcwCwcHMDDHZw3kkZ8IlIMASLRa5yk6PQqKqGjGkQhjlVMCwrCokFGnlMd5U0fVPChQ0khSaYoAEu1yLqQcql+Is-T1BQ9CYywCFkRSVM0MFqnUsYw0IWEln0iDhKGB5fL0Mc3lUQkSU0HphxzKp83sSwnhczS3JrNcvLI4TgTVZwFDkGlAskKoSXVQcNGY7QXF9aQlBw1zq1rdlORmFKhNudUemkTLsvVZhLHy2SEBLSUmjeZQzyUSppR4pKTSjS0GvjUimv7MECCGZiRzy8z3RVX5anlXRpUUok9Am2sGyEntUtuXRKLs1b6iy35mF0FUtGWqpfSLewpKUY6132DdGqTK7yRu5gjPu5int6xx5GcYsmmLYK2srDTGQIV93wB-c3sHDV7qeHQXBkZCbzQ9MbuqaQnw8NwgA */
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
