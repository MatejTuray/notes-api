const request = require("supertest");
const expect = require("expect");
const app = require("../server").app;
const uuid = require("uuid").v4;
const mongoose = require("mongoose");
const validate = require("uuid-validate");
const Export = mongoose.model("exports");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://admin:admin1@ds029454.mlab.com:29454/notes-api", {
  useNewUrlParser: true
});
const Note = mongoose.model("notes");

before(done => {
  Note.deleteMany({}, err => console.log(err));
  Export.deleteMany({}, err => console.log(err));
  let customNote, customList;
  customNote = {
    key: "f628df21-15ab-4326-b11f-47f6fcd80f55",
    title: "Title custom note",
    text: "Some text",
    date: 2161465465,
    remind: true,
    remindDate: "somestring",
    color: "#fffff"
  };
  customList = {
    key: "16d1fe3f-6eb2-4d60-8a3d-b2187b320967",
    title: "Title custom list",
    list: ["item1", "item2", "item3"],
    date: 2161465465,
    remind: true,
    remindDate: "somestring",
    color: "#fffff",
    totalPrice: 20
  };
  let exportData = {
    key: "d5c66f1e-f5c5-4e37-a056-deed96586627",
    email: "server.personalmoviedb@gmail.com",
    data: ["some data", "another stuff"]
  };

  Note.insertMany(customNote);
  Note.insertMany(customList);
  Export.insertMany(exportData);
  done();
});

describe("POST /api/note", () => {
  it("should save a note", done => {
    let note = {
      key: uuid(),
      title: "Title note",
      text: "Some text",
      date: 2161465465,
      remind: true,
      remindDate: "somestring",
      color: "#fffff"
    };

    request(app)
      .post("/api/note")
      .send(note)
      .expect(200)
      .expect(response => {
        expect(response.body.title).toBe(note.title);
      })
      .end(done);
  });
  it("should not save a note without valid uuid", done => {
    let note = {
      key: 41234512351251,
      title: "Title note",
      text: "Some text",
      date: 2161465465,
      remind: true,
      remindDate: "somestring",
      color: "#fffff"
    };
    request(app)
      .post("/api/note")
      .send(note)
      .expect(400)
      .expect(response => {
        expect(response.body.response).toBe("Invalid key");
      })
      .end(done);
  });
});
describe("POST /api/list", () => {
  it("should save a list", done => {
    let list = {
      key: uuid(),
      title: "Title list",
      list: ["item1", "item2", "item3"],
      date: 2161465465,
      remind: true,
      remindDate: "somestring",
      color: "#fffff",
      totalPrice: 20
    };

    request(app)
      .post("/api/note")
      .send(list)
      .expect(200)
      .expect(response => {
        expect(response.body.title).toBe(list.title);
      })
      .end(done);
  });
  it("should not save a list without valid uuid", done => {
    let list = {
      key: 5152141234124,
      title: "Title list",
      list: ["item1", "item2", "item3"],
      date: 2161465465,
      remind: true,
      remindDate: "somestring",
      color: "#fffff",
      totalPrice: 20
    };

    request(app)
      .post("/api/note")
      .send(list)
      .expect(400)
      .expect(response => {
        expect(response.body.response).toBe("Invalid key");
      })
      .end(done);
  });
});

describe("GET /api/items/:key", () => {
  it("should retrieve a list", done => {
    request(app)
      .get(`/api/items/16d1fe3f-6eb2-4d60-8a3d-b2187b320967`)
      .expect(200)
      .expect(response => {
        expect(response.body.key).toBe("16d1fe3f-6eb2-4d60-8a3d-b2187b320967");
        expect(response.body.list).toEqual(["item1", "item2", "item3"]);
        expect(validate(response.body.key)).toBe(true);
      })
      .end(done);
  });
  it("should retrieve a note", done => {
    request(app)
      .get(`/api/items/f628df21-15ab-4326-b11f-47f6fcd80f55`)
      .expect(200)
      .expect(response => {
        expect(response.body.key).toBe("f628df21-15ab-4326-b11f-47f6fcd80f55");
        expect(response.body.text).toEqual("Some text");
        expect(validate(response.body.key)).toBe(true);
      })
      .end(done);
  });
  it("should not retrieve a note with invalid uuid", done => {
    request(app)
      .get(`/api/items/f628df21-15ab-4326-d80f55`)
      .expect(404)
      .expect(response => {
        expect(response.body.response).toBe("Unable to resolve request");
      })
      .end(done());
  });
});
describe("DELETE api/items/:key", () => {
  it("should not delete a note with invalid uuid", done => {
    request(app)
      .delete(`/api/items/f628df21-15ab-4326-d80f55`)
      .expect(400)
      .expect(response => {
        expect(response.body.response).toBe("Invalid ID format");
      })
      .end(done);
  });
  it("should return 404 if no key is supplied", done => {
    request(app)
      .delete(`/api/items/`)
      .expect(404)
      .end(done);
  });
  it("should delete a list", done => {
    request(app)
      .delete(`/api/items/16d1fe3f-6eb2-4d60-8a3d-b2187b320967`)
      .expect(200)
      .expect(response => {
        expect(response.body.response).toBe("Deleted");
      })
      .end((err, res) => {
        Note.findOne({ key: "16d1fe3f-6eb2-4d60-8a3d-b2187b320967" })
          .then(res => {
            expect(res).toNotExist();
            done();
          })
          .catch(e => done(e));
      });
  });
  it("should delete a note", done => {
    request(app)
      .delete(`/api/items/f628df21-15ab-4326-b11f-47f6fcd80f55`)
      .expect(200)
      .expect(response => {
        expect(response.body.response).toBe("Deleted");
      })
      .end((err, res) => {
        Note.findOne({ key: "f628df21-15ab-4326-b11f-47f6fcd80f55" })
          .then(res => {
            expect(res).toNotExist();
            done();
          })
          .catch(e => done(e));
      });
  });
  it("should check for successfull post and delete requests -> 2 notes saved 2 deleted", done => {
    Note.find()
      .then(res => {
        expect(res.length).toBe(2);
        done();
      })
      .catch(e => done(e));
  });
});
describe("GET api/letaky", () => {
  it("should fetch last one doc of links", done => {
    request(app)
      .get("/api/letaky")
      .expect(200)
      .expect(response => {
        expect(response.body.list.length).toBe(5);
      })
      .end(done());
  });
});
describe("POST api/export", () => {});
it("should save valid export data and send to valid email", done => {
  let exportData = {
    key: uuid(),
    email: "server.personalmoviedb@gmail.com",
    data: ["some data", "another stuff"],
    duration: 2,
    type: "multiple"
  };
  request(app)
    .post("/api/export")
    .send(exportData)
    .expect(200)
    .expect(response => {
      expect(response.body.response).toBe("Export successful");
    })
    .end(done);
});
it("should not save and send when email is invalid", done => {
  let exportData = {
    key: uuid(),
    email: "server.personalmoviedb@gmailzzz.com",
    data: ["some data", "another stuff"],
    duration: 2,
    type: "multiple"
  };
  request(app)
    .post("/api/export")
    .send(exportData)
    .expect(400)
    .expect(response => {
      expect(response.body.response).toBe("Invalid e-mail address provided");
    })
    .end(done);
});
it("should not save when key/uuid is invalid", done => {
  let exportData = {
    key: "1221313",
    email: "server.personalmoviedb@gmail.com",
    data: ["some data", "another stuff"],
    duration: 2,
    type: "multiple"
  };
  request(app)
    .post("/api/export")
    .send(exportData)
    .expect(400)
    .expect(response => {
      expect(response.body.response).toBe("Invalid key");
    })
    .end(done);
});
describe("GET /api/import/:ekey", () => {
  it("should return valid data", done => {
    request(app)
      .get("/api/import/d5c66f1e-f5c5-4e37-a056-deed96586527")
      .expect(200)
      .expect(response => {
        expect(response.body.data[0]).toBe("some data");
      })
      .end(done());
  });
});

after(done => {
  Note.deleteMany({}, err => {
    console.log(err);
  });
  Export.deleteMany({}, err => {
    console.log(err);
  });

  done();
});
