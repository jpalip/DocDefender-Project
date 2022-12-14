import { prisma, s3 } from "../index.js";
import multer from "multer";
import multerS3 from "multer-s3";

export default async (req, res) => {
  var filename;

  const upload = multer({
    storage: multerS3({
      s3,
      bucket: process.env.DO_SPACES_NAME,
      acl: "",
      key: function (request, file, cb) {
        cb(null, file.originalname);
      },
    }),
  }).single("file");

  upload(req, res, async function (err) {
    if (err) {
      console.log(err);
      return res.json({ error: err.message });
    }
    filename = req.file.originalname;
    var params = {
      Bucket: process.env.DO_SPACES_NAME,
      Key: filename,
      Expires: 60,
    };
    var fileURL = s3.getSignedUrl("getObject", params);
    await prisma.file.create({
      data: {
        authorId: req.id,
        url: fileURL,
        author: {
          connect: {
            id: req.id,
          },
        },
        title: filename,
      },
    });

    return res.json({ success: "File has been successfully uploaded" });
  });
};
