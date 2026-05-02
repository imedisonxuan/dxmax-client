/** 公告"已读最大 id"持久化(localStorage) */

const READ_KEY = 'dxmax_notice_max_read_id'

export function getMaxReadNoticeId(): number {
  const v = localStorage.getItem(READ_KEY)
  return v ? Number(v) || 0 : 0
}

export function setMaxReadNoticeId(id: number) {
  localStorage.setItem(READ_KEY, String(id))
}
