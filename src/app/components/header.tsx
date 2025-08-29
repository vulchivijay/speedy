
export default function MainHeader() {
  return (
    <div className="bg-white dark:bg-gray-900">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav aria-label="Global" className="flex items-center justify-between p-4 lg:px-8">
          <div className="flex lg:flex-1">
            <a href="#" className="flex align-items-center -m-1.5 p-1.5">
              <span className="sr-only">Your Company</span>
              <img
                alt="logo"
                src="bolt.svg"
                className="h-8 w-auto"
              />
              <span className='text-xl font-semibold ps-2'>Speed Test</span>
            </a>
          </div>
        </nav>
      </header>
    </div>
  )
}
