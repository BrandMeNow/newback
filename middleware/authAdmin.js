import React from 'react'


const authAdmin = async (req, res) => {
    try {
        const { adminId, adminToken } = req.body
        if (!adminId || !adminToken) {
            return res.status(400).send({
                success: false,
                message: 'Unauthorized - No Token Provided'
            })
        }
        const admin = await adminModel.findById({ adminId })
        if (!adminId) {
            return res.status(400).send({
                success: false,
                message: 'Unauthorized - No Token Provided'
            });
        }
        // password check

        const isMatch = await bcrypt.compare(password, admin
            .password);
        if (!isMatch) {
            return res.status(401).send({
                success: false,
                message: 'password is not incorrect',
                admin,
            });
        }

        return res.status(200).send({
            success: true,
            message: 'login sucesssfully',
            admin,
        })

    } catch (error) {
        return res.status(500).send
            ({
                message: `error on login ${error}`,
                success: false,
                error
            })
    }
}


export default authAdmin