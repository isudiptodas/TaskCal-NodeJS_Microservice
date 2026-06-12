import { Link } from 'react-router-dom'

function Landing() {
  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black sm:px-12">
      <nav className="flex items-center justify-between">
        <Link className="text-3xl font-normal" to="/">
          TaskCal
        </Link>
        <div className="flex items-center gap-3">
          <Link className="px-5 py-3 text-blue-600" to="/auth/login">
            Login
          </Link>
          <Link className="rounded-full bg-blue-500 px-6 py-3 text-white" to="/auth/register">
            Sign up
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl items-center gap-12 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <div>
          <h1 className="text-5xl font-normal leading-tight sm:text-7xl lg:text-5xl">Calendar-first task planning.</h1>
          <p className="mt-6 max-w-xl text-xl leading-8 text-neutral-600">
            Save tasks on exact dates, scan your month at a glance, and let reminders handle the days that matter.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link className="rounded-full bg-blue-500 px-8 py-4 text-xl text-white" to="/auth/register">
              Create account
            </Link>
            <Link className="rounded-full bg-neutral-200 px-8 py-4 text-xl" to="/auth/login">
              Open dashboard
            </Link>
          </div>
        </div>

        <div className="border-2 border-black bg-white p-5 shadow-2xl">
          <div className="mb-6 flex items-center gap-4">
            <span className="text-3xl">June 2026</span>
            <span className="h-0 w-0 border-x-12px border-t-12px border-x-transparent border-t-black" />
            <span className="ml-auto h-12 flex-1 rounded-full bg-neutral-300" />
          </div>
          <div className="grid grid-cols-7 text-center text-lg">
            {['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'].map((day) => (
              <span className="pb-4 text-sm" key={day}>
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 28 }).map((_, index) => (
              <span
                className={`grid aspect-[1.35/1] text-sm place-items-center border-2 ${index < 5 ? 'border-fuchsia-300 bg-fuchsia-50 text-neutral-400' : index > 24 ? 'border-orange-200 bg-orange-50 text-neutral-400' : 'border-emerald-200 bg-emerald-50'} ${index === 13 ? 'bg-emerald-400 outline-2 outline-black -outline-offset-2' : ''}`}
                key={index}
              >
                {index < 5 ? index + 27 : index > 24 ? index - 24 : index - 4}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default Landing
