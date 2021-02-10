// add admin
// const adminForm = document.querySelector('.admin-actions');
// adminForm.addEventListener('submit', (e) => {
//     e.preventDefault();
//     const adminEmail = document.querySelector('#admin-email').value;
//     const adminAdd = functions.httpsCallable('adminAdd');
//     adminAdd({ email: adminEmail }).then((result) => {
//         console.log(result);
//     });
// })

// listen for auth status changes
auth.onAuthStateChanged((user) => {
	if (user) {
		document.getElementById('ulFront').style.display = 'none';
		document.getElementById('ul').style.display = 'block';
		user.getIdTokenResult().then((idTokenResult) => {
			user.admin = idTokenResult.claims.admin;
			if (user.admin) {
				setupUI(user);
				setupUsers();
			} else {
				loadFront(false);
				setupUI(user);
				document.getElementById('ul').innerHTML = 'Loading';

				setupStudents(user);
			}
		});
	} else {
		
		setupUI();
		document.getElementById('ul').style.display = 'none';
		document.getElementById('ulFront').style.display = 'block';
		setupStudents(false);
		loadFront(true);
	}
});

// sign up
const singupForm = document.querySelector('#signup-form');
singupForm.addEventListener('submit', (e) => {
	e.preventDefault();

	// get user info
	const email = singupForm['signup-email'].value;
	const password = singupForm['signup-password'].value;
	const passkey = singupForm['signup-passkey'].value;
	if (passkey == 'accelerando') {
		// signup user
		auth
			.createUserWithEmailAndPassword(email, password)
			.then((e) => {
				const email = e.user.email;
				const uid = e.user.uid;
				db.ref(`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content`)
					.push({
						email: email,
						uid: uid,
					})
					.then(() => {
						db.ref(`users/${uid}`)
							.set({ info: { email: email } })
							.then(() => {
								const modal = document.querySelector('#modal-signup');
								M.Modal.getInstance(modal).close();
								singupForm.reset();
							});
					});
			})
			.catch((err) => {
				document.getElementById('signup-error').innerHTML = err.message;
			});
	} else {
		document.getElementById('signup-error').innerHTML = 'Incorrect sign up key';
	}
});

// get info for front page
const preFrontEditForm = document.querySelector('#preEditFront-form');
preFrontEditForm.addEventListener('submit', (e) => {
	e.preventDefault();
	db.ref(
		`users/Xw2NIcmtLOMvR8HgLzMUBYDBiYf2/content/${preFrontEditForm['group1'].value}`
	)
		.once('value', (snap) => {
			editor.setContents(snap.val());
		})
		.catch((err) => {
			document.getElementById('editFront-error').innerHTML = err.message;
		});
});

// edit front page
const editfrontForm = document.querySelector('#editFront-form');
editfrontForm.addEventListener('submit', (e) => {
	e.preventDefault();
	let sec = {};
	switch (preFrontEditForm['group1'].value) {
		case 'secOne':
			sec = 'secOne';
			break;
		case 'secTwo':
			sec = 'secTwo';
			break;
		case 'secThree':
			sec = 'secThree';
			break;
		case 'secFour':
			sec = 'secFour';
			break;
		case 'secFive':
			sec = 'secFive';
			break;
		default:
	}
	db.ref(`users/Xw2NIcmtLOMvR8HgLzMUBYDBiYf2/content/${sec}`)
		.set(editor.getContents())
		.then(() => {
			const modal = document.querySelector('#modal-editFront');
			M.Modal.getInstance(modal).close();
			editfrontForm.reset();
		})
		.catch((err) => {
			document.getElementById('editFront-error').innerHTML = err.message;
		});
});

// login in
const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('submit', (e) => {
	e.preventDefault();

	// get user info
	const email = loginForm['login-email'].value;
	const password = loginForm['login-password'].value;

	// login user
	auth
		.signInWithEmailAndPassword(email, password)
		.then((cred) => {
			const modal = document.querySelector('#modal-login');
			M.Modal.getInstance(modal).close();
			loginForm.reset();
			var elems = document.querySelectorAll('.sidenav');
			M.Sidenav.init(elems);
		})
		.catch((err) => {
			document.getElementById('login-error').innerHTML = err.message;
		});
});

// create student

const createStudentForm = document.querySelector('#createStudent-form');
createStudentForm.addEventListener('submit', (e) => {
	e.preventDefault();
	// get student info
	const fName = createStudentForm['createStudent-firstName'].value;
	const lName = createStudentForm['createStudent-lastName'].value;
	const bdate = createStudentForm['createStudent-bdate'].value;
	const userId = auth.currentUser.uid;
	db.ref('users/' + userId + '/students')
		.push({
			firstName: fName,
			lastName: lName,
			birthDate: bdate,
		})
		.then(() => {
			document.getElementById('ul').innerHTML = 'Loading';
			const modal = document.querySelector('#modal-createStudent');
			M.Modal.getInstance(modal).close();
			loginForm.reset();
			db.ref(`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content`)
				.orderByChild('uid')
				.once('value', (snap) => {
					snap.forEach((el) => {
						if (el.val().uid == userId) {
							const userPath = el.ref_.path.pieces_[3];
							db.ref(`users/${userId}/students`)
								.once('value', (snap2) => {
									stu = [];
									snap2.forEach((element2) => {
										let stuid = element2.ref_.path.pieces_[3];
										let fName = element2.val().firstName;
										src = element2.ref_.path.pieces_[1];
										stu.push({
											studentId: stuid,
											firstName: fName,
											sourceId: src,
										});
									});
									console.log(stu);
									stu.forEach((el2) => {
										if (el2.firstName == fName) {
											db.ref(
												`users/6Tvtz5BN65hHTd8kST4sFwVPGkm1/content/${userPath}/students`
											).push(el2);
										}
									});
								})
								.then(() => {
									window.location.href = 'index.html';
								});
						}
					});
				});
		})
		.catch((err) => {
			document.getElementById('createStudent-error').innerHTML = err.message;
		});
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
