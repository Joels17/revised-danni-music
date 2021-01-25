// listen for auth status changes
auth.onAuthStateChanged((user) => {
	if (user) {
		const loggedIn = document.querySelectorAll('.logged-in');
		// show items that are meant for logged in users
		loggedIn.forEach((el) => {
			el.style.display = 'block';
		});
		// get user token to check for admin role
		user.getIdTokenResult().then((idTokenResult) => {
			user.admin = idTokenResult.claims.admin;
			// if admin role then search for student id
			if (user.admin) {
				const queryString = window.location.search;
				const urlParams = new URLSearchParams(queryString);
				const sid = urlParams.get('studentId');
				// if student id that means we can create notes, so show the option to do so
				if (sid) {
					const allowCreate = document.getElementById('allowCreateNote');
					const allowCreateMobile = document.getElementById(
						'allowCreateNote-mobile'
					);
					allowCreate.style.display = 'block';
					allowCreateMobile.style.display = 'block';
				}
				// show delete student link
				const deleteLink = document.getElementById('delete-student');
				deleteLink.style.display = 'block';

				setupStudent(user);
			} else {
				setupStudent(user);
			}
		});
	} else {
		// if not logged in then show please login message
		document.getElementById('ul-notes').innerHTML = 'Please Login';
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
	// look through the smaller list of users as to not load all the notes, and when the uid matches continue
	// repeat but with student ids to find desired student id without having to load any notes
	db.ref(`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content`)
		.orderByChild('uid')
		.once('value', (snap) => {
			snap.forEach((el) => {
				if (el.val().uid == uid) {
					const userPath = el.ref_.path.pieces_[3];
					db.ref(
						`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content/${userPath}/students`
					).once('value', (snap2) => {
						snap2.forEach((el2) => {
							if (el2.val().studentId == sid) {
								const studentPath = el2.ref_.path.pieces_[5];
								db.ref(
									`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content/${userPath}/students/${studentPath}`
								)
									.remove()
									.then(() => {
										const modal = document.querySelector(
											'#modal-deleteStudent'
										);
										M.Modal.getInstance(modal).close();
										deletStudentForm.reset();
										window.location.href = 'index.html';
									});
							}
						});
					});
				}
			});
		});
});

// load notes for student
const setupStudent = (user) => {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const sid = urlParams.get('studentId');
	const uid = urlParams.get('userId');
	const noteId = urlParams.get('noteId');
	const notesLink = document.getElementById('ul-notes');

	if (sid) {
		// check if logged in
		if (user) {
			let userId = '';
			// if there is a user in the params then use that (only admin can do this)
			if (uid) {
				userId = uid;
			} else {
				// take user currently logged in
				userId = auth.currentUser.uid;
			}
			if (noteId && user.admin) {
				// edit note
				const allowCreate = document.getElementById('allowCreateNote');

				allowCreate.style.display = 'none';
				const deleteLink = document.getElementById('delete-student');
				const noteDiv = document.getElementById('editNoteDiv');
				noteDiv.style.display = 'block';
				notesLink.style.display = 'none';
				const noteTitleEdit = document.getElementById('noteTitleEdit');
				deleteLink.innerHTML = `<li><a href="#" class="modal-trigger" data-target="modal-deleteNote">Delete Note?</a></li>`;
				db.ref(`users/${userId}/students/${sid}/notes/${noteId}`).once(
					'value',
					(snap) => {
						const note = snap.val().noteBody;
						const title = snap.val().noteTitle;
						noteTitleEdit.innerHTML = `${title}`;

						editor.setContents(note);
					}
				);
			} else {
				// search notes
				let html = [];
				let noteId = '';

				const info = document.getElementById('studentInfo');
				info.style.display = 'block';

				// show student info on their page
				let infoFirstName = '';
				let infoLastName = '';
				let infoBirthdate = '';
				db.ref(`users/${userId}/students/${sid}/firstName`)
					.once('value', (snap) => {
						infoFirstName = snap.val();
					})
					.then(() => {
						db.ref(`users/${userId}/students/${sid}/lastName`)
							.once('value', (snap) => {
								infoLastName = snap.val();
							})
							.then(() => {
								db.ref(`users/${userId}/students/${sid}/birthDate`)
									.once('value', (snap) => {
										infoBirthdate = snap.val();
									})
									.then(() => {
										info.innerHTML = `<div id="studentInfo><div id="studentName"><h4>${infoFirstName}</h4><h4>${infoLastName}</h4><h5>${infoBirthdate}</h5></div><div id="studentBox">Welcome to your personal student page! This is where you can find all lesson notes, homework, music, and information provided specifically for you by Danni.<div></div>`;
									});
							});
					});

				// show notes with limit, pagination
				let offset = 3;

				var ref = db
					.ref('users/' + userId + '/students/' + sid + '/notes')
					.limitToLast(offset);
				ref.once('value', (snap) => {
					notesLink.innerHTML = 'Loading';

					offset += 5;
					snap.forEach((element) => {
						const note = element.val().noteBody;
						const title = element.val().noteTitle;
						noteId = element.ref_.path.pieces_[5];
						let li = '';
						if (user.admin) {
							li = `<li><h4><a href ="student.html?userId=${userId}&studentId=${sid}&noteId=${noteId}">${title}</a></h4></li><li>${note}</li>`;
						} else {
							li = `<li><h4>${title}</h4></li><li>${note}</li>`;
						}

						html.push(li);
					});

					let htmlFinal = '';
					html.reverse().forEach((el) => {
						htmlFinal += el;
					});
					if (htmlFinal == '') {
						htmlFinal = 'No notes to show';
						const load = document.getElementById('loadDiv');
						load.style.display = 'none';
						const search = document.getElementById('searchDiv');
						search.style.display = 'none';
					} else {
						const search = document.getElementById('searchDiv');
						search.style.display = 'block';

						const load = document.getElementById('loadDiv');
						load.style.display = 'block';
					}

					notesLink.innerHTML = htmlFinal;
					// load more notes

					const createNote = document.getElementById('loadMore');
					createNote.addEventListener('click', (e) => {
						e.preventDefault();

						createNote.innerHTML = 'Loading';
						var ref2 = db
							.ref('users/' + userId + '/students/' + sid + '/notes')
							.limitToLast(offset);
						ref2.once('value', (snap) => {
							let html2 = [];
							offset += 5;
							snap.forEach((element) => {
								const note = element.val().noteBody;
								const title = element.val().noteTitle;
								noteId = element.ref_.path.pieces_[5];
								let li = '';
								if (user.admin) {
									li = `<li><h4><a href ="student.html?userId=${userId}&studentId=${sid}&noteId=${noteId}">${title}</a></h4></li><li>${note}</li>`;
								} else {
									li = `<li><h4>${title}</h4></li><li>${note}</li>`;
								}

								html2.push(li);
							});

							htmlFinal = '';
							html2.reverse().forEach((el) => {
								htmlFinal += el;
							});
							notesLink.innerHTML = htmlFinal;
							createNote.innerHTML = 'Load More';
						});
					});
				});

				// search notes
				const searchNoteForm = document.querySelector('#searchNotes-form');
				searchNoteForm.addEventListener('submit', (e) => {
					e.preventDefault();
					const searchBut = document.getElementById('search-button');
					searchBut.innerHTML = 'Loading';
					const search = e.target[0].value;
					db.ref(`users/${userId}/students/${sid}/notes`)
						.orderByChild('noteTitle')
						.startAt(search)
						.endAt(`${search}\uF7FF`)
						.once('value', (snap) => {
							let li = '';
							let html3 = [];

							if (snap.val() == null) {
								html3.push(
									'No results. Please type the note exactly as it is (CASE SENSITIVE).'
								);
							} else {
								snap.forEach((element) => {
									const note = element.val().noteBody;
									const title = element.val().noteTitle;
									noteId = element.ref_.path.pieces_[5];
									li = '';
									if (user.admin) {
										li = `<li><h4><a href ="student.html?userId=${userId}&studentId=${sid}&noteId=${noteId}">${title}</a></h4></li><li>${note}</li>`;
									} else {
										li = `<li><h4>${title}</h4></li><li>${note}</li>`;
									}
									html3.push(li);
								});
							}
							let finalHTML2 = '';
							html3.reverse().forEach((el) => {
								finalHTML2 += el;
							});
							notesLink.innerHTML = finalHTML2;
							searchBut.innerHTML = 'Search';
						});
				});
			}
		} else {
			// not logged in, show login message
			notesLink = document.getElementById('student-body');
			notesLink.innerHTML = 'Login Please';
		}
	} else {
		//if student id doesn't exist then list students
		const allowCreate = document.getElementById('allowCreateNote');
		allowCreate.style.display = 'none';
		const deleteLink = document.getElementById('delete-student');
		deleteLink.style.display = 'none';
		const studentsList = document.getElementById('ul-notes');
		let html = '';
		db.ref(`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content`)
			.orderByChild('uid')
			.once('value', (snap) => {
				snap.forEach((el) => {
					if (el.val().uid == uid) {
						const src = el.ref_.path.pieces_[3];
						const stus = el.val().students;
						let li = '';
						for (var key in stus) {
							db.ref(
								`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content/${src}/students/${key}`
							)
								.orderByChild('uid')
								.once('value', (snap2) => {
									li = `<li class="studentSelect"><a href="student.html?userId=${uid}&studentId=${
										snap2.val().studentId
									}">${snap2.val().firstName}</a></li>`;
								})
								.then(() => {
									html += li;

									if (html != '') {
										studentsList.innerHTML = html;
									}
								});
						}

						if (html == '') {
							studentsList.innerHTML = 'No students';
						}
					}
				});
			});
	}
};

// edit note
const editNoteForm = document.querySelector('#editNote-form');
editNoteForm.addEventListener('submit', (e) => {
	e.preventDefault();
	auth.onAuthStateChanged((user) => {
		if (user.admin) {
			const queryString = window.location.search;
			const urlParams = new URLSearchParams(queryString);
			const sid = urlParams.get('studentId');
			const uid = urlParams.get('userId');
			const noteId = urlParams.get('noteId');
			if (noteId) {
				db.ref(`users/${uid}/students/${sid}/notes/${noteId}/noteTitle`)
					.set(e.target[0].value)
					.then(() => {
						db.ref(`users/${uid}/students/${sid}/notes/${noteId}/noteBody`)
							.set(editor.getContents())
							.then(() => {
								window.location.href = `student.html?userId=${uid}&studentId=${sid}`;
							});
					});
			} else {
				db.ref(`users/${uid}/students/${sid}/notes`)
					.push({
						noteTitle: e.target[0].value,
						noteBody: editor.getContents(),
					})
					.then(() => {
						window.location.href = `student.html?userId=${uid}&studentId=${sid}`;
					});
			}
		} else {
			console.log('Must login');
		}
	});
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
	db.ref(`users/${uid}/students/${sid}/notes/${noteId}`)
		.remove()
		.then(() => {
			window.location.href = `student.html?userId=${uid}&studentId=${sid}`;
		});
});

// create note
const createNote = document.getElementById('allowCreateNote');
createNote.addEventListener('click', (e) => {
	e.preventDefault();
	const load = document.getElementById('loadDiv');
	load.style.display = 'none';
	const info = document.getElementById('studentInfo');
	info.style.display = 'none';
	const search = document.getElementById('searchDiv');
	search.style.display = 'none';
	const notesLink = document.getElementById('ul-notes');
	notesLink.style.display = 'none';
	const noteDiv = document.getElementById('editNoteDiv');
	noteDiv.style.display = 'block';
	const deleteLink = document.getElementById('delete-student');
	deleteLink.style.display = 'none';
});

// create note mobile
const createNoteMobile = document.getElementById('allowCreateNote-mobile');
createNoteMobile.addEventListener('click', (e) => {
	e.preventDefault();
	const load = document.getElementById('loadDiv');
	load.style.display = 'none';
	const info = document.getElementById('studentInfo');
	info.style.display = 'none';
	const search = document.getElementById('searchDiv');
	search.style.display = 'none';
	const notesLink = document.getElementById('ul-notes');
	notesLink.style.display = 'none';
	const noteDiv = document.getElementById('editNoteDiv');
	noteDiv.style.display = 'block';
	const deleteLink = document.getElementById('delete-student');
	deleteLink.style.display = 'none';
	const elems = document.querySelector('.sidenav');
	M.Sidenav.getInstance(elems).close();
});

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
document.addEventListener('DOMContentLoaded', function () {
	var modals = document.querySelectorAll('.modal');
	M.Modal.init(modals);

	var elems = document.querySelectorAll('.sidenav');
	M.Sidenav.init(elems);
});
