Just a simple test to create a helm chart for a simple web app

# build the image
`docker build  -t localhost:32000/plaggona:latest .`

# push the image
`docker push localhost:32000/plaggona:latest`

# Make the chart
inside folder `charts`
Init with: `microk8s.helm3 create plaggona-k8s`

make a work on `values.yaml`

```
image:
  registry: localhost:32000
  repository: gladii
  tag: latest
  pullPolicy: Always

service:
  type: ClusterIP
  port: 8631

ingress:
  enabled: true
  annotations:
    traefik.ingress.kubernetes.io/router.tls: "true"
    traefik.ingress.kubernetes.io/router.tls.certresolver: leresolver
    traefik.ingress.kubernetes.io/router.tls.domains.0.main: plaggona.com
    traefik.ingress.kubernetes.io/router.tls.domains.0.sans: www.plaggona.com
  hosts:
    - host: plaggona.com
      paths: 
        - path: "/"

resources:
  limits: {}
  requests:
    memory: 64Mi
    cpu: 100m
```

# fix ingres template

sould change the `templates/ingress.yaml` file.
from `apiVersion: networking.k8s.io/v1beta1` to `apiVersion: networking.k8s.io/v1`
to fix the error: `no matches for kind "Ingress" in version "networking.k8s.io/v1beta1"`

and rules
```
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: Prefix
            backend:
               service:
                  name: {{ $fullName }}
                  port:
                    number: {{ $svcPort }}
          {{- end }}
```

# fix deployment template
`containerPort: {{ .Values.service.port }}`

# make a package
`microk8s.helm3 package -d ./plaggona-k8s ./plaggona-k8s`
# install it
`microk8s.helm3 install plaggona-k8s -n default ./plaggona-k8s/plaggona-k8s-0.1.0.tgz`
# uninstall it if needed
`microk8s.helm3 uninstall plaggona-k8s -n default`