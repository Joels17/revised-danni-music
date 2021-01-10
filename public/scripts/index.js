
const studentsList = document.getElementById('ul');
const loggedIn = document.querySelectorAll('.logged-in');
const loggedOut = document.querySelectorAll('.logged-out');
const adminItems = document.querySelectorAll('.admin');

const setupUI = (user) =>{
    if(user){
        document.getElementById('frontBanner').innerHTML = `<h4>Student Page</h4>`;
        if(user.admin){
            adminItems.forEach(el => {
                el.style.display = 'block'
            });
        }
        loggedIn.forEach(el => {
            el.style.display = 'block'
        });
        loggedOut.forEach(el => {
            el.style.display = 'none'
        });
    }else{
        adminItems.forEach(el => {
            el.style.display = 'none'
        });
        loggedIn.forEach(el => {
            el.style.display = 'none'
        });
        loggedOut.forEach(el => {
            el.style.display = 'block'
        });
    }
}

// setup students
const setupStudents = (user) => {
    const uid = user.uid;
    db.ref(`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content`).orderByChild('uid').once('value', snap => {
        snap.forEach(el => {
            if(el.val().uid == uid){
                let html = `<p id="logInfo">Click on a student to view their notes</p>`;
                const src = (el.ref_.path.pieces_[3]);
                const stus = (el.val().students);
                let li = "";
                for (var key in (stus)) {
                    db.ref(`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content/${src}/students/${key}`).orderByChild('uid').once('value', snap2 => {
                        li = `<li><a href="student.html?studentId=${snap2.val().studentId}">${snap2.val().firstName}</a></li>`;
                    }).then(() => {
                        html+=li;
                        
                        if(html == `<p id="logInfo">Click on a student to view their notes</p>`){
                            html = "No students to show";
                        }
                        studentsList.innerHTML = `${html}<li><a href="#" class="modal-trigger btn blue" data-target="modal-createStudent">Add Student</a></li>`;
                        
                    })
                    
                }
                if(html == ""){
                    studentsList.innerHTML = `${html}<li><a href="#" class="modal-trigger" data-target="modal-createStudent">Add Student</a></li>`;
                }
                
                //const li = `<li><a href="student.html?userId=${uid}&studentId=${el.ref.path.pieces_[3]}">${fname}</a></li>`;
            }
        });
    
    });


};

// need to add auto adding to this content, (from create new user/ sign up). Possibly add for students too
// setup users
const setupUsers = () => {
    const frontContent = document.getElementById('ul');
    frontContent.innerHTML = "Loading";
    let html = "";
    db.ref('users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content').orderByChild('email').once('value', (snap)=>{
        // console.log('starting');
        // adding students for optimization
        snap.forEach(element => {
            // let userd = element.val().uid;  
            // let stu = [];
            // let src = "";
            // db.ref(`users/${userd}/students`).once('value', (snap2) => {
            //     stu = [];
            //     snap2.forEach(element2 => {
            //         let stuid = element2.ref_.path.pieces_[3];
            //         let fName = element2.val().firstName;
            //         src = element2.ref_.path.pieces_[1];
            //         stu.push({studentId: stuid, firstName: fName, sourceId: src});

                    
            //     });
            //     let userPath = element.ref_.path.pieces_[3];
            //     stu.forEach((el) => {
            //         db.ref(`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content/${userPath}/students`).push(el).then(() => {
            //             console.log("ADDED");
            //         })
            //     })
                
            // })


            const li = `<li><a href="student.html?userId=${element.val().uid}">${element.val().email}</a></li>`;
                    
            html+=li;
        });
        frontContent.innerHTML = html;
    });

};

// loading front page content
const loadFront = (data) => {
    if(data){
        document.getElementById('ulFront').style.display = 'block';
        const sections = ['secOne','secTwo','secThree','secFour','secFive'];
        const frontContent = document.getElementById('ulFront');
        frontContent.innerHTML = "Loading";
        let html = "";
        let li = "";
        const prom = new Promise((resolve, reject) => {
            sections.forEach(el => {
            var ref = db.ref(`users/Xw2NIcmtLOMvR8HgLzMUBYDBiYf2/content/${el}`);
            ref.once('value', (data)=>{
                li = `<li>${data.val()}</li>`;
                html+=`<div id='${el}'>${li}</div>`;

            }).then(() => {
                if(el == 'secFive'){
                    resolve();
                }
                });
            });

        });
        prom.then(() => {
            frontContent.innerHTML = `${html}`; 
        });
        
        
        

        

    }else{
        const frontContent = document.getElementById('ul');
        frontContent.innerHTML = "Loading";
    }
}

//setup mat comps
document.addEventListener('DOMContentLoaded', function(){
    var modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);
    var elems = document.querySelectorAll('.sidenav');
    M.Sidenav.init(elems);
    
});

