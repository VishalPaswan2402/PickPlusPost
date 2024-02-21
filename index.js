const mysql = require('mysql2');
const express=require("express");
const { v4: uuidv4 } = require('uuid');
const app=express();
const path=require("path");
const methodOverride=require("method-override");
const { constants } = require('buffer');
// const { Script } = require('vm');
// const { Connection } = require('mysql2/typings/mysql/lib/Connection');
app.use(methodOverride("_method"));

app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"/views"));
app.use(express.static(path.join(__dirname,"public")));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'post',
    password:"mysql#123",
  });


// Log in Page...
app.get("/",(req,res)=>{
    res.render("login.ejs");
});


// Home Page...
app.post("/home",(req,res)=>{
  let{username,password}=req.body;
    let count=`SELECT COUNT (username) as num FROM user WHERE username='${username}'`;
    connection.query(count,(err,result)=>{
      if(err){
        console.log(err);
        return res.status(500).render("serverError.ejs");
      }
      const num = result[0].num;
      if(num>0){
        let users=`SELECT * FROM user WHERE username='${username}'`;
        connection.query(users,(err,result)=>{
          if(err){
            console.log(err);
            return res.status(500).render("serverError.ejs");
          }
          let oriPass=result[0].password;
          let Uusers=result[0];
          if(oriPass===password){
            let show=`SELECT * FROM allpost ORDER BY date DESC LIMIT 100`;
            connection.query(show,(err,result)=>{
              if(err){
                console.log(err);
                return res.status(500).render("serverError.ejs");
              }
              let all=result;
              res.render("home.ejs",{Uusers,all});
            })
          }
          else{
            res.render("inPass.ejs");
          }
        })
      }
      else{
        res.render("error.ejs");
     }
  })
});


// New Post Page...
app.get("/:username/:id/newpost",(req,res)=>{
  let{username,id}=req.params;
  res.render("newPost.ejs",{username,id});
});


// Add New Post...
app.post("/:username/:id", (req, res) => {
  let { username, id } = req.params;
  let { image, post,date } = req.body;
  let postId=uuidv4();
  let post1 = `INSERT INTO allpost (id,username,postid,post,date) VALUES (?,?,?,?,?)`;
  let values1 = [id,username,postId,post,date];
  let post2 = `INSERT INTO allpost (id,username,postid,post,image,date) VALUES (?,?,?,?,?,?)`;
  let values2 = [id,username,postId,post,image,date];
  if(image===""){
    connection.query(post1,(err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).render("serverError.ejs");
      }
      res.redirect(`/${username}/${id}`);
   })
  }
  else{
    connection.query(post2, values2, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).render("serverError.ejs");
      }
      res.redirect(`/${username}/${id}`);
    })
  }
});


// Edit Post Page...
app.get("/:username/:id/:postid/edit_post",(req,res)=>{
  let{username,id,postid}=req.params;
  let original=`SELECT * FROM allpost WHERE postid='${postid}'`;
  connection.query(original,(err,result)=>{
    if(err){
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
    let oriData=result[0];
    res.render("editPost.ejs",{oriData,id,username});
  })
});


// Edit Post Details...
app.put("/:username/:id/:postid",(req,res)=>{
  let{username,id,postid}=req.params;
  let{image,post}=req.body;
  let editData=`UPDATE allpost SET image='${image}',post='${post}' WHERE postid='${postid}'`;
  connection.query(editData,(err,result)=>{
    if(err){
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
    res.redirect(`/${username}/${id}`);
  })
});


// Sign In Page...
app.get("/signin",(req,res)=>{
  res.render("signin.ejs");
});


//New User Sign In...
app.post("/congrats",(req,res)=>{
  let{username,email,mobile,country,password,pass}=req.body;
  let id=uuidv4();
  let count=`SELECT COUNT(username) as num FROM user WHERE username='${username}'`;
  connection.query(count,(err,result)=>{
    if(err){
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
    let num = result[0].num;
    if(num>0){
      res.send("Already Exist...");
    }
    else{
      let user=`INSERT INTO user values ('${id}','${username}','${email}','${mobile}','${country}','${password}')`;
      if(pass===password){
        connection.query(user,(err,result)=>{
          if(err){
            console.log(err);
            return res.status(500).render("serverError.ejs");
          }
          res.render("congrats.ejs");
        })
      }
    }
  })
});


// User Page...
app.get("/:username/:id", (req, res) => {
  let { username, id } = req.params;
  let datas = `SELECT * FROM user WHERE username='${username}' and id='${id}'`;
  connection.query(datas,(err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
    let allPost = `SELECT * FROM allpost WHERE username='${username}' and id='${id}' ORDER BY date DESC`;
    connection.query(allPost, (err, allPost) => {
      if (err) {
        console.log(err);
        return res.status(500).render("serverError.ejs");
      }
      res.render("user.ejs", { username,id, allPost });
    });
  });
});


// Forget Password Page...
app.get("/forgot",(req,res)=>{
  res.render("forgot.ejs");
});


// Password Changed...
app.post("/password_changed",(req,res)=>{
  let{username,email,password}=req.body;
  let count=`SELECT COUNT (username) as num FROM user WHERE username='${username}' and email='${email}'`;
  connection.query(count,(err,result)=>{
    if(err){
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
    const num = result[0].num;
    if(num>0){
      let change=`UPDATE user SET password='${password}' where username='${username}' and email='${email}'`;
      connection.query(change,(err,result)=>{
        if(err){
          console.log(err);
          return res.status(500).render("serverError.ejs");
        }
        res.render("passChange.ejs");
      })
    }
    else{
      res.render("error.ejs");
    }
  })
});


// Delete Account Page...
app.get("/:username/:id/delete_account",(req,res)=>{
  let{username,id}=req.params;
  res.render("deleteAcc.ejs",{username,id});
});


// Enter Data To Delete Account...
app.delete("/:username/:id",(req,res)=>{
  let{id}=req.params;
  let{username,email,password,click1}=req.body;
  if(click1==="1"){
    let all=`SELECT * FROM user WHERE username='${username}' and id='${id}'`;
    connection.query(all,(err,result)=>{
      if(err){
        console.log(err);
        return res.status(500).render("serverError.ejs");
      }
      {
        let orEmail=result[0].email;
        let orPass=result[0].password;
        if(orEmail===email && orPass===password){
          let del=`DELETE FROM user WHERE username='${username}' and email='${email}' and password='${password}' and id='${id}'`;
          connection.query(del,(err,result)=>{
            if(err){
              console.log(err);
              return res.status(500).render("serverError.ejs");
            }
            {
              let postDel=`DELETE FROM allpost WHERE username='${username}' and id='${id}'`;
              connection.query(postDel,(err,result)=>{
              if(err){
                console.log(err);
                return res.status(500).render("serverError.ejs");
              }
              {
                let delfrndreq=`DELETE FROM friendrequest WHERE byusername='${username}' and byid='${id}'`;
                connection.query(delfrndreq,(err,result)=>{
                  if(err){
                    console.log(err);
                    return res.status(500).render("serverError.ejs");
                  }
                  {
                    let delfrnds=`DELETE FROM allfriends WHERE friendid='${id}' or id='${id}'`;
                    connection.query(delfrnds,(err,result)=>{
                      if(err){
                        console.log(err);
                        return res.status(500).render("serverError.ejs");
                      }
                      res.render("delSad.ejs");
                    })
                  }
                })
              }
              })
            }
          })
        }
        else{
          res.render("serverError.ejs");
        }
      }
    })
  }
  else{
    // console.log("not ckecked...");
  }
});


// Delete Post...
app.delete("/:username/:id/:postid", (req, res) => {
  let { username, id, postid} = req.params;
  let deletePostQuery = `DELETE FROM allpost WHERE postid='${postid}' and username='${username}'`;
    connection.query(deletePostQuery, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).render("serverError.ejs");
      }
      res.redirect(`/${username}/${id}`);
    })
});


// Find People Page...
app.get("/:username/:id/people", (req, res) => {
  let { username, id } = req.params;
  let allResults;
  res.render("friends.ejs", { username, id, allResults });
});


// Search People...
app.post("/:username/:id/people", (req, res) => {
  let { username, id } = req.params;
  let { people } = req.body;
  let findPeople = `SELECT * FROM user WHERE username LIKE '%${people}%'`;
  connection.query(findPeople, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
      let allResults = result;
    res.render("friends.ejs", { username,id,allResults });
  });
});


// View Users Page...
app.get("/:username/:id/view",(req,res)=>{
  let{username,id}=req.params;
  let allPost = `SELECT * FROM allpost WHERE username='${username}' and id='${id}' ORDER BY date DESC`;
    connection.query(allPost, (err, allPost) => {
      if (err) {
        console.log(err);
        return res.status(500).render("serverError.ejs");
      }
      res.render("viewUser.ejs", { username,id, allPost });
    });
});


// Your Followers...
app.get("/:username/:id/following",(req,res)=>{
  let{username,id}=req.params;
  let allfriends=`SELECT * FROM allfriends WHERE friendname='${username}' and friendid='${id}'`;
  connection.query(allfriends,(err,result)=>{
    if(err){
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
    let allfrnds=result
    res.render("following.ejs",{username,id,allfrnds});
  });
});


// Your Following...
app.get("/:username/:id/followers",(req,res)=>{
  let{username,id}=req.params;
  let allfriends=`SELECT * FROM allfriends WHERE username='${username}' and id='${id}'`;
  connection.query(allfriends,(err,result)=>{
    if(err){
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
    let allfrnds=result
    res.render("followers.ejs",{username,id,allfrnds});
  });
});


// Remove Friend...
app.delete("/:friendname/:friendid/:username/:id", (req, res) => {
  let { friendname, friendid,username,id} = req.params;
  let delfrnd=`DELETE FROM allfriends WHERE id='${id}' AND friendid='${friendid}'`;
  connection.query(delfrnd,(err,result)=>{
    if(err){
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
    res.redirect(`/${username}/${id}/following`);
  });
});


// Delete Request...
app.delete("/:username/:id/:byusername/:byid/deleteReq", (req, res) => {
  let { byusername, byid,username,id} = req.params;
  let delReqs=`DELETE FROM friendrequest WHERE byid='${byid}'AND tofriendid='${id}'`;
  connection.query(delReqs,(err,result)=>{
    if(err){
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
    res.redirect(`/${username}/${id}/request`);
  })
});


// Friend Request...
app.get("/:username/:id/request",(req,res)=>{
  let{username,id}=req.params;
  let requests=`SELECT * FROM friendrequest WHERE tofriendid='${id}' AND tofriendname='${username}'`;
  connection.query(requests,(err,result)=>{
    if(err){
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
    {
      let allRequests=result;
      let sentRequests=`SELECT * FROM friendrequest WHERE byid='${id}' AND byusername='${username}'`;
      connection.query(sentRequests,(err,result)=>{
        if(err){
          console.log(err);
          return res.status(500).render("serverError.ejs");
        }
        let allSents=result;
        res.render("request.ejs",{allRequests,allSents,username,id});
      });
    }
  });
});


// Accept Request...
app.post("/:username/:id/:byusername/:byid/accept", (req, res) => {
  let { byusername, byid,username,id} = req.params;
  let allfriends=`INSERT INTO allfriends VALUES ('${id}','${username}','${byid}','${byusername}')`;
  connection.query(allfriends,(err,result)=>{
    if(err){
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
    {
      let deleting=`DELETE FROM friendrequest WHERE byid='${byid}' AND tofriendid='${id}'`;
      connection.query(deleting,(err,result)=>{
        if(err){
          console.log(err);
          return res.status(500).render("serverError.ejs");
        }
        res.redirect(`/${username}/${id}/request`);
      })
    }
  })
});


// Send Request...
app.post("/:tofrndname/:tofrndid/:username/:id/send",(req,res)=>{
  let{tofrndname,tofrndid,username,id}=req.params;
  let reqsends=`INSERT INTO friendrequest VALUES ('${id}','${username}','${tofrndid}','${tofrndname}')`;
  connection.query(reqsends,(err,result)=>{
    if(err){
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
    res.redirect(`/${username}/${id}/people`);
  })
})


// Cancle Sent Request...
app.delete("/:tofrndname/:tofrndid/:username/:id/cancle",(req,res)=>{
   let{tofrndname,tofrndid,username,id}=req.params;
   let cancle=`DELETE FROM friendrequest WHERE byid='${id}' AND tofriendid='${tofrndid}'`;
   connection.query(cancle,(err,result)=>{
    if(err){
      console.log(err);
      return res.status(500).render("serverError.ejs");
    }
    res.redirect(`/${username}/${id}/request`);
   })
})


// Server Setup...
app.listen("8080",()=>{
  console.log("Server is listening...");
});
