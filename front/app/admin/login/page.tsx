import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-2xl font-black text-white">Conexa Penca</h1>
          <p className="text-gray-500 text-sm mt-1">Panel de administración</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
