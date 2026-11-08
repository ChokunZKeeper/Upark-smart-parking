import Navbar from '@/components/system_layout/layout/Navbar'

interface PlaceholderPageProps {
  title: string
  description: string
}

function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <Navbar title={title} />

      <main className="flex flex-1 items-center justify-center p-6">
        <p className="max-w-sm text-center text-sm text-gray-500">{description}</p>
      </main>
    </>
  )
}

export default PlaceholderPage