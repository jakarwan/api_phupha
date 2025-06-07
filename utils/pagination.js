function paginateQuery(req, model) {
  const page = parseInt(req.query.page) || 1;
  const per_page = parseInt(req.query.per_page) || 10;

  const startIndex = (page - 1) * per_page;
  const endIndex = page * per_page;

  const data = model.slice(startIndex, endIndex);

  return {
    data,
    pagination: {
      page,
      per_page,
      total: model.length
    }
  };
}

module.exports = paginateQuery;
