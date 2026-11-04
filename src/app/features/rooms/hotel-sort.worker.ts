addEventListener('message', ({ data }) => {
  console.log('[Worker] Received sorting request', data.requestId);

  const { requestId, rooms, direction } = data;

  const sortedRooms = [...rooms].sort((a, b) =>
    direction === 'asc'
      ? a.price - b.price
      : b.price - a.price
  );

  postMessage({ requestId, rooms: sortedRooms });
});