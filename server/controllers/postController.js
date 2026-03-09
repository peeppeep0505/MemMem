const Post = require("../models/Post");

exports.createPost = async (req, res) => {
  const post = await Post.create({
    userId: req.body.userId,
    text: req.body.text,
    images: req.files?.map((f) => f.filename),
  });

  res.json(post);
};

exports.deletePost = async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);

  res.json({ message: "deleted" });
};


exports.likePost = async (req,res)=>{
  console.log("BODY:", req.body)
  console.log("PARAM:", req.params)

  const postId = req.params.id
  const { userId } = req.body

  const post = await Post.findById(postId)

  const alreadyLiked = post.likes.includes(userId)

  if(alreadyLiked){
    post.likes.pull(userId)
  }else{
    post.likes.push(userId)
  }

  await post.save()

  res.json(post)
}