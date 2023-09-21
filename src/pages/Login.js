// ** React Imports
import React, { useState } from 'react'

// ** MUI Components
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import FormControl from '@mui/material/FormControl'
import OutlinedInput from '@mui/material/OutlinedInput'
import { styled } from '@mui/material/styles'
import InputAdornment from '@mui/material/InputAdornment'
import MuiFormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Icon from '../components/Icon'
import CircularProgress from "../components/CircularProgress"

import { useAuth } from '../hooks/useAuth'

// ** Third Party Imports
import * as yup from 'yup'
import {
    useForm,
    Controller
} from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

const FormControlLabel = styled(MuiFormControlLabel)(({ theme }) => ({
    '& .MuiFormControlLabel-label': {
        fontSize: '0.875rem',
        color: theme.palette.text.secondary
    }
}))

const schema = yup.object().shape({
    email: yup.string().email().required(),
    password: yup.string().required()
})

const defaultValues = {
    password: '',
    email: ''
}

const LoginV1 = () => {

    const [rememberMe, setRememberMe] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [isFetching, setIsFetching] = useState(false)

    const {
        control,
        setError,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues,
        mode: 'onBlur',
        resolver: yupResolver(schema)
    })

    // ** Hook
    const auth = useAuth()

    const onSubmit = async (data) => {

        try {

            const { email, password } = data;
            setIsFetching(true)

            await auth.login({
                email,
                password,
                rememberMe

            }, (err) => {

                console.log(err)
                setIsFetching(false)

                if (
                    err
                    && err.response
                    && err.response.data
                ) {
                    let errors = err.response.data;
                    errors.length > 0
                        && errors.forEach(item => {
                            setError(item.field, {
                                type: 'manual',
                                message: item.message
                            })
                        })
                }
            })
            setIsFetching(false)

        } catch (error) {
            setIsFetching(false)
        }


    }

    return (
        <Box className='login-container'>
            <Box sx={{
                mt: 10,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <img className="logo" src="assets/imgs/logo-with-name.svg" alt="logo here" />
            </Box>
            <form
                noValidate
                autoComplete='off'
                onSubmit={handleSubmit(onSubmit)}
            >
                <FormControl fullWidth sx={{ mb: 4 }}>
                    <Controller
                        name='email'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange, onBlur } }) => (
                            <TextField
                                autoFocus
                                label='Email'
                                value={value}
                                onBlur={onBlur}
                                onChange={onChange}
                                error={Boolean(errors.email)}
                                placeholder='admin@materialize.com'
                            />
                        )}
                    />
                    {errors.email
                        && <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>}
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel htmlFor='auth-login-v2-password' error={Boolean(errors.password)}>
                        Password
                    </InputLabel>
                    <Controller
                        name='password'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange, onBlur } }) => (
                            <OutlinedInput
                                value={value}
                                onBlur={onBlur}
                                label='Password'
                                onChange={onChange}
                                id='auth-login-v2-password'
                                error={Boolean(errors.password)}
                                type={showPassword ? 'text' : 'password'}
                                endAdornment={
                                    <InputAdornment position='end'>
                                        <IconButton
                                            edge='end'
                                            onMouseDown={e => e.preventDefault()}
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <Icon icon={showPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} fontSize={20} />
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        )}
                    />
                    {
                        errors.password
                        && (
                            <FormHelperText sx={{ color: 'error.main' }} id=''>
                                {errors.password.message}
                            </FormHelperText>
                        )
                    }
                </FormControl>

                <Box
                    sx={{
                        mt: 2,
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between'
                    }}
                >
                    <FormControlLabel
                        label='Remember Me'
                        control={<Checkbox
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)} />
                        }
                        sx={{ '& .MuiFormControlLabel-label': { color: 'text' } }}
                    />
                    <a href='https://panel.staffmonitor.app/site/reset' target="__blank">
                        <Typography
                            variant='body2'
                            sx={{ color: 'primary.darker', textDecoration: 'none' }}
                        >
                            Forgot Password?
                        </Typography>
                    </a>
                </Box>


                {!isFetching && <Button
                    disabled={isFetching}
                    size='large'
                    variant='contained'
                    sx={{
                        mt: 2,
                        ml: "auto",
                        display: "block",
                    }}
                    type="submit"
                >
                    Sign in
                </Button>}
                {isFetching &&
                    <Box
                        sx={{
                            mt: 2,
                            ml: "auto",
                            display: 'flex',
                            alignItems: 'end',
                            flexWrap: 'wrap',
                            justifyContent: 'flex-end'
                        }}
                    >
                        <CircularProgress style={{ width: "15px", height: "15px",margin: '10px' }} />
                    </Box>
                }
                <Divider
                    sx={{
                        '& .MuiDivider-wrapper': { px: 2, color: "grey" }
                    }}
                >
                    or
                </Divider>
                <a href="https://panel.staffmonitor.app/account/create" target="__blank">
                    <Button fullWidth size='large' variant='contained' sx={{ mb: 7, mt: 3 }} >
                        CREATE AN ACCOUNT
                    </Button>
                </a>
            </form>
            {/* <FooterIllustrationsV1 /> */}
        </Box>
    )
}

export default LoginV1