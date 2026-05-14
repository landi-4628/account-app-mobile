export function buildAuthRequiredDialogState(onConfirm) {
  return {
    title: '请先登录',
    description: '登录后才能查看和操作你的账本数据。',
    actions: [
      { label: '取消', tone: 'secondary' },
      { label: '去登录', tone: 'primary', onPress: onConfirm },
    ],
  };
}
