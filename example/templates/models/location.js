module.exports = function(RentalLocation, Base) {
  RentalLocation.nearby = function(here, page, max, fn) {
    if (typeof page === 'function') {
      fn = page;
      page = 0;
      max = 0;
    }

    if (typeof max === 'function') {
      fn = max;
      max = 0;
    }

    var limit = 10;
    page = page || 0;
    max = Number(max || 100000);

    RentalLocation.find({
      // find locations near the provided GeoPoint
      where: {geo: {near: here, maxDistance: max}},
      // paging
      skip: limit * page,
      limit: limit
    }, fn);
  };

  RentalLocation.beforeSave = function(next, loc) {
    if (loc.geo) return next();

    // geo code the address
    var geoService = RentalLocation.app.dataSources.geo;
    geoService.geocode(loc.street, loc.city, loc.state,
      function(err, result) {
        if (result && result[0]) {
          loc.geo = result[0].lng + ',' + result[0].lat;
          next();
        } else {
          next(new Error('could not find location'));
        }
      });
  };

  RentalLocation.setup = function() {
    Base.setup.apply(this, arguments);

    this.remoteMethod('nearby', {
      description: 'Find nearby locations around the geo point',
      accepts: [
        {arg: 'here', type: 'GeoPoint', required: true,
          description: 'geo location (lat & lng)'},
        {arg: 'page', type: 'Number',
          description: 'number of pages (page size=10)'},
        {arg: 'max', type: 'Number',
          description: 'max distance in miles'}
      ],
      returns: {arg: 'locations', root: true},
      http: { verb: 'GET' }
    });
  };

  RentalLocation.setup();
};
