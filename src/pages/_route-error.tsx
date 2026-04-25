import { useRouteError } from 'react-router'

export default function RouteErrorBoundary() {
  const err = useRouteError()
  console.error('[ROUTE ERROR]', err)
  const msg =
    err instanceof Error
      ? `${err.name}: ${err.message}\n\n${err.stack}`
      : JSON.stringify(err, null, 2)
  return (
    <div
      style={{
        padding: 32,
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#EF4444',
        whiteSpace: 'pre-wrap',
        background: '#FFF',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 12 }}>路由错误:</div>
      {msg}
    </div>
  )
}
