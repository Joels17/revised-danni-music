
// listen for auth status changes
auth.onAuthStateChanged((user) => {
    if (user) {
        const loggedIn = document.querySelectorAll('.logged-in')
        loggedIn.forEach(el => {
            el.style.display = 'block'
        });
        user.getIdTokenResult().then((idTokenResult) => {
            user.admin = (idTokenResult.claims.admin);
            if(user.admin){
                const queryString = window.location.search;
                const urlParams = new URLSearchParams(queryString);
                const sid = urlParams.get('studentId');
                if(sid){
                    const allowCreate = document.getElementById("allowCreateNote");
                    const allowCreateMobile = document.getElementById("allowCreateNote-mobile");
                    allowCreate.style.display = 'block';
                    allowCreateMobile.style.display = 'block';
                }

                const deleteLink = document.getElementById("delete-student");

                deleteLink.style.display = 'block';
                setupStudent(user);

            }else{
                setupStudent(user);

            }
        })

    } else {
        document.getElementById('ul-notes').innerHTML='Please Login';
      
    }
  });

// delete student
const deletStudentForm = document.querySelector('#deleteStudent-form');
deletStudentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sid = urlParams.get('studentId');
    const uid = urlParams.get('userId');
	// db.ref(`users/${uid}/students/${sid}`).remove().then(() => {
        db.ref(`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content`).orderByChild('uid').once('value', (snap) => {
            snap.forEach((el) => {
                if(el.val().uid == uid){
                    const userPath = (el.ref_.path.pieces_[3]);
                    db.ref(`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content/${userPath}/students`).once('value', (snap2) => {
                        snap2.forEach((el2) => {
                            if(el2.val().studentId == sid){
                                const studentPath = (el2.ref_.path.pieces_[5]);
                                db.ref(`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content/${userPath}/students/${studentPath}`).remove().then(() => {
                                    const modal = document.querySelector('#modal-deleteStudent');
                                    M.Modal.getInstance(modal).close();
                                    deletStudentForm.reset();
                                    window.location.href = 'index.html';
                                })
                            }
                        })


                    })
                }
            })
        })

    // }).catch((err) => {
    //     document.getElementById('deleteStudent-error').innerHTML = err.message;
    // });
});


// load notes for student
const setupStudent = (user) => {

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sid = urlParams.get('studentId');
    const uid = urlParams.get('userId');
    const noteId = urlParams.get('noteId');
    const notesLink = document.getElementById("ul-notes");
    
    if(sid){
        if (user) {
            let userId = "";
            if(uid){
                userId = uid;
            }else{
                userId = auth.currentUser.uid;
            }
            if(noteId && user.admin){
                const allowCreate = document.getElementById("allowCreateNote");
                
                allowCreate.style.display = 'none';
                const deleteLink = document.getElementById("delete-student");
                const noteDiv = document.getElementById("editNoteDiv");
                noteDiv.style.display = 'block';
                notesLink.style.display = 'none';
                const noteTitleEdit = document.getElementById("noteTitleEdit");
                deleteLink.innerHTML = `<li><a href="#" class="modal-trigger" data-target="modal-deleteNote">Delete Note?</a></li>`;
                db.ref(`users/${userId}/students/${sid}/notes/${noteId}`).once('value', (snap)=>{
                    const note = snap.val().noteBody;
                    const title = snap.val().noteTitle;
                    noteTitleEdit.innerHTML = `${title}`;
                    
                    editor.setContents(note);
                    
                })
            }else{
                // search notes
                let html = [];
                let noteId = "";

                const info = document.getElementById("studentInfo");
                info.style.display = 'block';

                let infoFirstName = "";
                let infoLastName = "";
                let infoBirthdate = "";
                db.ref(`users/${userId}/students/${sid}/firstName`).once('value', (snap) => {
                    infoFirstName = snap.val();
                }).then(() => {
                    db.ref(`users/${userId}/students/${sid}/lastName`).once('value', (snap) => {
                        infoLastName = snap.val();
                    }).then(() => {
                        db.ref(`users/${userId}/students/${sid}/birthDate`).once('value', (snap) => {
                            infoBirthdate = snap.val();
                        }).then(() => {
                            info.innerHTML = `<div id="studentInfo><div id="studentName"><h4>${infoFirstName}</h4><h4>${infoLastName}</h4><h5>${infoBirthdate}</h5></div><div id="studentBox">Welcome to your personal student page! This is where you can find all lesson notes, homework, music, and information provided specifically for you by Danni.<div></div>`
                        })
                    })
                })
                


                let offset = 3;
                
                var ref = db.ref('users/'+userId+'/students/'+sid +"/notes").limitToLast(offset);
                ref.once('value', (snap)=>{
                    notesLink.innerHTML = "Loading";
                    
                    offset+=5;
                    snap.forEach(element => {
                        const note = (element.val().noteBody);
                        const title = element.val().noteTitle;
                        noteId = (element.ref_.path.pieces_[5]);
                        let li = "";
                        if(user.admin){
                            li = `<li><h4><a href ="student.html?userId=${userId}&studentId=${sid}&noteId=${noteId}">${title}</a></h4></li><li>${note}</li>`;
                        }else{
                            li = `<li><h4>${title}</h4></li><li>${note}</li>`;
                        }
                        
                       
                        html.push(li);
                    });

                    let htmlFinal = "";
                    html.reverse().forEach(el => {
                        htmlFinal+=el;
                    });
                    if(htmlFinal==""){
                        htmlFinal="No notes to show";
                        const load = document.getElementById("loadDiv");
                        load.style.display = 'none';
                        const search = document.getElementById("searchDiv");
                        search.style.display = 'none';
                    }else{
                        const search = document.getElementById("searchDiv");
                        search.style.display = 'block';
        
                        const load = document.getElementById("loadDiv");
                        load.style.display = 'block';
                    }

                    notesLink.innerHTML = htmlFinal;
                    // load more
                    
                    const createNote = document.getElementById('loadMore');
                    createNote.addEventListener('click', (e) => {
                        e.preventDefault();
                        
                        createNote.innerHTML = "Loading";
                        var ref2 = db.ref('users/'+userId+'/students/'+sid +"/notes").limitToLast(offset);
                        ref2.once('value', (snap) =>{
                            let html2 = [];
                            offset+=5;
                            snap.forEach(element => {
                                const note = (element.val().noteBody);
                                const title = element.val().noteTitle;
                                noteId = (element.ref_.path.pieces_[5]);
                                let li = "";
                                if(user.admin){
                                    li = `<li><h4><a href ="student.html?userId=${userId}&studentId=${sid}&noteId=${noteId}">${title}</a></h4></li><li>${note}</li>`;
                                }else{
                                    li = `<li><h4>${title}</h4></li><li>${note}</li>`;
                                }
                                
                                
                                
                                html2.push(li);
                                
                            });
                            
                            htmlFinal = "";
                            html2.reverse().forEach(el => {
                                htmlFinal+=el;
                            });
                            notesLink.innerHTML = htmlFinal;
                            createNote.innerHTML = "Load More";
                        })

                    })
                });
                const searchNoteForm = document.querySelector('#searchNotes-form');
                searchNoteForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const searchBut = document.getElementById("search-button");
                        searchBut.innerHTML = 'Loading';
                    const search = (e.target[0].value);
                    db.ref(`users/${userId}/students/${sid}/notes`).orderByChild('noteTitle').startAt(search).endAt(`${search}\uF7FF`).once('value', (snap) => {
                        
                        let li = "";
                        let html3 = [];
                        
                        if(snap.val()== null){
                            html3.push("No results. Please type the note exactly as it is (CASE SENSITIVE).");
                        }else{
                            snap.forEach(element => {
                                
                                const note = (element.val().noteBody);
                                const title = element.val().noteTitle;
                                noteId = (element.ref_.path.pieces_[5]);
                                li = "";
                                if(user.admin){
                                    li = `<li><h4><a href ="student.html?userId=${userId}&studentId=${sid}&noteId=${noteId}">${title}</a></h4></li><li>${note}</li>`;
                                }else{
                                    li = `<li><h4>${title}</h4></li><li>${note}</li>`;
                                }
                                html3.push(li);
                                
                                
                            });
                        }
                        let finalHTML2 = "";
                        html3.reverse().forEach(el => {
                            finalHTML2+=el;
                        });
                        notesLink.innerHTML = finalHTML2;
                        searchBut.innerHTML = 'Search';
                    });

                });
            }

        } else {
            notesLink = document.getElementById("student-body");
            notesLink.innerHTML = "Login Please";
        }
        
    }else {
        const allowCreate = document.getElementById("allowCreateNote");          
        allowCreate.style.display = 'none';
        const deleteLink = document.getElementById("delete-student");
        deleteLink.style.display = 'none';
        const studentsList = document.getElementById('ul-notes');
        let html = "";
        db.ref(`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content`).orderByChild('uid').once('value', snap => {
            snap.forEach(el => {
                if(el.val().uid == uid){
                    
                    const src = (el.ref_.path.pieces_[3]);
                    const stus = (el.val().students);
                    let li = "";
                    for (var key in (stus)) {
                        db.ref(`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content/${src}/students/${key}`).orderByChild('uid').once('value', snap2 => {
                            li = `<li class="studentSelect"><a href="student.html?userId=${uid}&studentId=${snap2.val().studentId}">${snap2.val().firstName}</a></li>`;
                        }).then(() => {
                            html+=li;
                            
                            if(html == ""){
                                html = "No students to show";
                            }
                            studentsList.innerHTML = html;
                        })
                        
                    }

                    //const li = `<li><a href="student.html?userId=${uid}&studentId=${el.ref.path.pieces_[3]}">${fname}</a></li>`;
                }
            });

            // snap.forEach(element => {

            //     html+=li;
            // });

        })
    }

};


// edit note
const editNoteForm = document.querySelector('#editNote-form');
editNoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    auth.onAuthStateChanged((user) => {
        if(user.admin){
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            const sid = urlParams.get('studentId');
            const uid = urlParams.get('userId');
            const noteId = urlParams.get('noteId');
            if(noteId){
                db.ref(`users/${uid}/students/${sid}/notes/${noteId}/noteTitle`).set(e.target[0].value).then(() => {
                    db.ref(`users/${uid}/students/${sid}/notes/${noteId}/noteBody`).set(editor.getContents()).then(() => {
                        window.location.href = `student.html?userId=${uid}&studentId=${sid}`;
                    });
                });
            }else{
                db.ref(`users/${uid}/students/${sid}/notes`).push({
                    noteTitle: e.target[0].value,
                    noteBody: editor.getContents()
                }).then(() => {
                    window.location.href = `student.html?userId=${uid}&studentId=${sid}`;
                    
                });
            }
        }else{
            console.log("Must login");
        }
    })


});

// delete note
const deleteNoteForm = document.querySelector('#deleteNote-form');
deleteNoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sid = urlParams.get('studentId');
    const uid = urlParams.get('userId');
    const noteId = urlParams.get('noteId');
    db.ref(`users/${uid}/students/${sid}/notes/${noteId}`).remove().then(() => {
        window.location.href = `student.html?userId=${uid}&studentId=${sid}`;
    })

});


// create note
const createNote = document.getElementById('allowCreateNote');
createNote.addEventListener('click', (e) => {
    e.preventDefault();
    const load = document.getElementById("loadDiv");
    load.style.display = 'none';
    const info = document.getElementById("studentInfo");
    info.style.display = 'none';
    const search = document.getElementById("searchDiv");
    search.style.display = 'none';
    const notesLink = document.getElementById('ul-notes');
    notesLink.style.display = 'none';
    const noteDiv = document.getElementById("editNoteDiv");
    noteDiv.style.display = 'block';
    const deleteLink = document.getElementById("delete-student");
    deleteLink.style.display = 'none';

})

// create note mobile
const createNoteMobile = document.getElementById('allowCreateNote-mobile');
createNoteMobile.addEventListener('click', (e) => {
    e.preventDefault();
    const load = document.getElementById("loadDiv");
    load.style.display = 'none';
    const info = document.getElementById("studentInfo");
    info.style.display = 'none';
    const search = document.getElementById("searchDiv");
    search.style.display = 'none';
    const notesLink = document.getElementById('ul-notes');
    notesLink.style.display = 'none';
    const noteDiv = document.getElementById("editNoteDiv");
    noteDiv.style.display = 'block';
    const deleteLink = document.getElementById("delete-student");
    deleteLink.style.display = 'none';
    const elems = document.querySelector('.sidenav');
    M.Sidenav.getInstance(elems).close();

})

// logout
const logout = document.querySelector('#logout');
logout.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut();
    window.location.href = 'index.html';
});
const logoutMobile = document.querySelector('#logout-mobile');
logoutMobile.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut();
    window.location.href = 'index.html';
});


//setup mat comps
document.addEventListener('DOMContentLoaded', function(){
    var modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);

    var elems = document.querySelectorAll('.sidenav');
    M.Sidenav.init(elems);

});