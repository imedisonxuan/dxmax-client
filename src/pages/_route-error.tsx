import { useRouteError } from 'react-router'

export default function RouteErrorBoundary() {
  const err = useRouteError()
  const errMsg = err instanceof Error ? err.message : String(err)
  const errName = err instanceof Error ? err.name : 'UnknownError'
  console.error('[ROUTE ERROR NAME]', errName)
  console.error('[ROUTE ERROR MSG]', errMsg)
  console.error('[ROUTE ERROR FULL]', err)
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
