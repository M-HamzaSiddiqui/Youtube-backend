const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};

export { asyncHandler };

// const asyncHandler = () => {}
// const asyncHandler = (fn) => async() => {}

// const asyncHandler = (fn) => async(req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }



// this is standard approach to handle asynchronous operations in a backend

// asyncHandler ek higherOrder function h jo ek function as a parameter accept karta h aur ek inner function return karta h. yaha par fn as parameter accept ho raha h aur ek naya async function return ho raha h aur express middleware stack use req, res aur next provide kar raha h. Basically ham ek wrapper use kar rahe h kisi async opertion ya function par jab koi router hit hoga.